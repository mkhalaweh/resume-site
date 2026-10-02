# Claude Code Handoff — Deploy mkhalaweh-web to my VPS

## What I need from you
Help me deploy my finished Next.js app (`mkhalaweh-web`) to my existing VPS infrastructure. Go step by step, test at each stage, and DO NOT break my currently-live site until the new one is proven. I like understanding the "why," and I want you to tell me when you're working from assumptions vs. certainty. Verify current docs/versions rather than relying on memory where it matters (Dockerfile patterns for Next.js 16 especially).

---

## MY EXISTING INFRASTRUCTURE (already built and working — don't recreate)

**VPS:** Contabo Cloud VPS, Ubuntu 22.04, ~11Gi RAM (10Gi free), 6 vCPU, 191GB disk, 4GB swap. Docker + Docker Compose installed. Non-root sudo user `sweet`. SSH on port 22. UFW allows only 22. There is ALSO a separate Contabo control-panel firewall (independent of UFW) — both must be open for a port to be externally reachable.

**What's already running on the VPS (via Docker):**
- A **Traefik v2.11** reverse proxy (container `traefik`), owns ports 80/8080. Config at `~/resume-site/traefik/traefik.yml` (static config: docker provider, `exposedByDefault: false`, dashboard on :8080 insecure). Routes via container labels.
- The **OLD static resume site** — an `nginx:alpine` container (`resume`) built from `~/resume-site/`, currently serving `mkhalaweh.dev`. THIS IS WHAT THE NEW APP REPLACES. Keep it running until cutover; keep it available for rollback.
- A **Wazuh 4.12 SIEM stack** (3 containers: indexer, manager, dashboard) in `~/wazuh-docker/single-node/`. Dashboard remapped to host port 8443 (not 443, to avoid Traefik collision). Leave it alone.
- Compose for the site lives in `~/resume-site/docker-compose.yml` (services: `traefik`, `resume`, shared `web` network, `external: false`).

**Cloudflare (domain mkhalaweh.dev, registered via Cloudflare, Active):**
- A **Cloudflare Tunnel** via `cloudflared` running as a systemd service (NOT docker). Config at `/etc/cloudflared/config.yml`, credentials at `/etc/cloudflared/<tunnel-id>.json`. Tunnel name is `homelab` (tunnel id in the config).
- Current tunnel ingress routes: `mkhalaweh.dev` → `http://localhost:80` (Traefik → resume site); `wazuh.mkhalaweh.dev` → `https://localhost:8443` (noTLSVerify); `traefik.mkhalaweh.dev` → `http://localhost:8080`. Catch-all 404 at the end.
- SSL/TLS mode pinned to **Full** (not Flexible, not Automatic). `www` CNAME + redirect rule → root exists.
- **Cloudflare Zero Trust** is set up. Team domain: `mkhalaweh.cloudflareaccess.com`. **GitHub is configured as the identity provider.** Existing **Access applications** protect `wazuh.` and `traefik.` subdomains, policy = allow email `mohamadhalaweh@hotmail.com` (my GitHub primary email).
- **Tailscale** is installed on the VPS (GitHub-auth tailnet). (Was mid-setup for private SSH; not blocking deployment.)

**CI/CD (exists for the OLD site, repo `resume-site`):**
- GitHub Actions pipeline with a SECURITY GATE: a `security` job runs **Semgrep** (SAST, via official `semgrep/semgrep` container, `semgrep scan --config auto --error`) and **Trivy** (image scan, `scanners: vuln,secret`, fails on CRITICAL/HIGH), then a `deploy` job (`needs: security`) SSHes into the VPS via `appleboy/ssh-action` and pulls+rebuilds.
- All GitHub Actions are **SHA-pinned** to verified commit SHAs (checked against signed release pages). This is a deliberate supply-chain practice — keep it. Current verified pins used before: `actions/checkout` → `9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0` (v7.0.0), `aquasecurity/trivy-action` → `ed142fd0673e97e23eac54620cfb913e5ce36c25` (v0.36.0), `appleboy/ssh-action` → `2ead5e36573f08b82fbfce1504f1a4b05a647c6f` (v1.2.2). Re-verify before reuse.
- GitHub secrets already set on the old repo: `VPS_HOST` (169.58.78.170), `VPS_USER` (sweet), `VPS_SSH_KEY` (private key; matching public key in VPS `~/.ssh/authorized_keys`).

---

## THE APP TO DEPLOY (`mkhalaweh-web`)

- Next.js **16.3.6** (App Router, TypeScript, Tailwind v4, `src/` dir, Turbopack). React 19.
- **Prisma 5.22.0** (pinned stable — DO NOT upgrade to 8.x RC). SQLite via `DATABASE_URL`.
- Deps: `@prisma/client` 5.22, `bcryptjs`, `jose`, `shiki`, Tailwind v4.
- Prisma client helper: `src/app/lib/db.ts`. Auth helper: `src/app/lib/auth.ts` (`getSession()`, jose JWT in httpOnly cookie). Resume helper: `src/app/lib/resume.ts`.
- `prisma/seed.ts` seeds: 1 admin User (bcrypt), 1 Resume row (my real data), 1 sample Article.
- Admin panel at `/admin/*` (app-level login against User table). Public: `/` (newspaper resume + interactive terminal), `/articles`, `/articles/[slug]`.
- Features added by the build: a contact form (`ContactMessage` model), article `tags`.

### Current Prisma schema (on disk)
User(id,email,passwordHash,createdAt) · Resume(id,name,title,location,about,skills,experience,certs,education[all JSON strings for the arrays],linkedin?,github?,updatedAt) · Article(id,slug,title,excerpt,content[rich HTML],coverImage?,tags,published,createdAt,updatedAt) · ContactMessage(id,name,email,message,read,createdAt).
NOTE: an earlier plan had optional `lede`/`email`/`phone` on Resume for editable contact info — these are NOT currently in the schema. I'll decide whether to add them; ask me.

### package.json gotcha
`"postinstall": "prisma skills sync || exit 0"` is leftover contamination from a Prisma 8 RC — it may break the Docker build. Remove or neutralize it.

---

## 🔴 CRITICAL PERSISTENCE PROBLEM — must fix BEFORE containerizing

Two upload handlers currently write into `public/`, which does NOT persist across container rebuilds (and standalone Next doesn't serve runtime-written files in `public/` reliably). **As-is, every redeploy wipes all uploaded images and the resume PDF.** Must fix.

- `src/app/api/upload/image/route.ts` → writes to `process.cwd()/public/uploads/`, returns `/uploads/<file>`.
- `src/app/api/resume/pdf/route.ts` → writes to `process.cwd()/public/resume.pdf`.

**Required fix (env-driven so local dev still works):**
1. Introduce `DATA_DIR` env var (default `./public` locally for back-compat, `/app/data` in container). Uploads go to `${DATA_DIR}/uploads`, the resume PDF to `${DATA_DIR}/resume.pdf`.
2. Since these are no longer under `public/`, add route handlers to SERVE them: e.g. `src/app/uploads/[filename]/route.ts` reads from `${DATA_DIR}/uploads` and streams the file (with correct content-type, path-traversal protection — reject `..`/slashes). Serve the PDF at `/resume.pdf` via a route reading `${DATA_DIR}/resume.pdf`.
3. The image handler keeps returning `/uploads/<file>` URLs (now served by the new route). Validate type+size, randomized filenames (already does), require auth (already does).
4. Keep behavior identical in local dev.

The persistent volume `/app/data` must hold: the SQLite DB (`prod.db`), `uploads/`, and `resume.pdf`.

---

## DEPLOYMENT SEQUENCE (do in order, test each; don't touch live site until Stage 5)

**Stage 0 — Fix uploads for persistence** (the critical fix above). Local change, test locally (`npm run dev`, upload an image, confirm it serves).

**Stage 1 — Production prep (local):**
- Add `output: "standalone"` to `next.config.ts`.
- Remove the `postinstall` prisma-skills line.
- Set production `DATABASE_URL="file:/app/data/prod.db"` (absolute, on the volume) — via container env, NOT the local `.env`.
- Create `.dockerignore` (node_modules, .next, .git, dev.db, .env, public/uploads).
- Confirm `.gitignore` excludes `.env`, `dev.db`, `prisma/dev.db`, `/public/uploads`, `node_modules`, `.next`.

**Stage 2 — Dockerfile + entrypoint:**
- Multi-stage Dockerfile for Next.js 16 standalone (verify the exact standalone run command/paths for Next 16 — it differs from older versions; check `node_modules/next/dist/docs/` and official docs). Must run `prisma generate` during build.
- Entrypoint script that, on container start: ensures `/app/data` and `/app/data/uploads` exist; runs `prisma db push` (creates/updates the SQLite file on the volume); runs the seed ONLY if the DB is empty/new (guard against re-seeding on every restart — check for existing User/Resume row first); then starts the server.
- Image should run as non-root where possible.

**Stage 3 — Add to compose + Traefik on VPS, test on a TEMP hostname (don't cut over):**
- Add a new service (e.g. `web`) to `~/resume-site/docker-compose.yml`, on the `web` network, with a **named Docker volume** mounted at `/app/data` (for DB + uploads + pdf), and env (`DATABASE_URL=file:/app/data/prod.db`, `DATA_DIR=/app/data`, session secret, admin creds).
- Traefik labels routing a TEMP hostname (e.g. `new.mkhalaweh.dev`) to the app's port (3000). Add a tunnel ingress + Cloudflare DNS for `new.mkhalaweh.dev` so it's reachable. Keep the old `resume` service untouched and still serving `mkhalaweh.dev`.
- Secrets: generate a strong session secret; set admin email/password via env for the seed. Never commit these.

**Stage 4 — Prove it:**
- Visit `new.mkhalaweh.dev`: resume + terminal render, articles work, `/admin` login works. Upload an image in an article, upload a resume PDF. Then `docker compose down && up` (or rebuild) and CONFIRM the image, PDF, and articles SURVIVE (the whole point — tests the volume). Confirm memory on the VPS is still healthy (`free -h`) alongside Wazuh.

**Stage 5 — Cutover:**
- Point Traefik's `mkhalaweh.dev` routing from the old `resume` container to the new `web` service (swap the Host rule/labels). The tunnel already sends `mkhalaweh.dev` → Traefik:80, so this is a Traefik-label change. Keep the old container defined but not routed, for instant rollback. Verify the live site is now the new app.

**Stage 6 — Admin behind Cloudflare Access:**
- Route `admin.mkhalaweh.dev` (tunnel ingress + DNS) to the app (Traefik label for the admin host, or same app). Create a Cloudflare **Access application** for `admin.mkhalaweh.dev`, GitHub IdP, policy allow `mohamadhalaweh@hotmail.com` — SAME pattern as the existing wazuh/traefik Access apps. Now admin has TWO layers: Cloudflare Access + the app's own login. (Decide: should the admin routes be ONLY on `admin.` subdomain and blocked on the main domain? Recommend yes — serve `/admin` only via the protected hostname.)

**Stage 7 — CI/CD (new repo):**
- New GitHub repo for `mkhalaweh-web` (keep it separate from `resume-site`). Adapt the existing pipeline: `security` job (Semgrep + Trivy, SHA-pinned actions — re-verify SHAs against signed releases) then `deploy` (SSH, pull, `docker compose build web && up -d web`). Reuse the VPS secrets pattern. Semgrep now has REAL app code to scan (meaningful SAST). Ensure the pipeline does NOT commit/expose secrets, the DB, or uploads.

**Stage 8 — Cleanup:** once confident, retire the old `resume` nginx container (keep a tagged image/backup for rollback). Document the final state.

---

## Gotchas / constraints (learned the hard way)
- Keep Prisma at **5.22.0**. Don't `npm audit fix --force`. Don't upgrade to RCs.
- Two firewall layers (UFW + Contabo panel) — a port needs both open to be externally reachable, but with the tunnel we DON'T open web ports externally at all; traffic comes via cloudflared. Keep it that way (only 22 exposed).
- SQLite is a FILE — it and the uploads MUST be on a persistent volume, or data is lost on redeploy. This is the #1 risk.
- Seed must run ONCE (guard against duplicate/every-restart seeding).
- Don't break the live `mkhalaweh.dev` until Stage 5; keep rollback ready.
- `.env`, `dev.db`, `/public/uploads`, credentials: never commit.
- Verify Next.js 16 standalone specifics from real docs (this Next version has breaking changes vs older tutorials — see the AGENTS.md note in the repo).
- I'm on Windows (Node 26, npm 11) for local dev; the VPS is Linux. Build the image for linux/amd64.

## First thing to do
Confirm you can see the project. Then start with **Stage 0** (the uploads persistence fix) since it's a prerequisite and a local-only change. Before writing the Dockerfile, verify the exact Next.js 16 standalone output structure and run command from the installed version's docs. Ask me about the `lede`/`email`/`phone` contact fields and whether to add them before deploy.
