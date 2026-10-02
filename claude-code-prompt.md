# Claude Code Handoff — mkhalaweh.dev Portfolio App

## Context / what I'm building
I'm building a personal portfolio + blog as a **Next.js app** that replaces my old static HTML resume site. The whole point: I want to **edit my resume and write articles from a private admin panel** without touching code. Public visitors see a resume site (with a fun interactive fake-terminal) and a blog; only I can access the admin panel.

This will eventually be Dockerized and deployed to a VPS behind a Cloudflare Tunnel, with the admin panel protected by Cloudflare Access. But **for now, focus only on building the app locally** — deployment comes later.

## Current state (already done — do NOT redo)
The project already exists at the current directory. Already set up:
- Next.js app (App Router, TypeScript, Tailwind, ESLint, `src/` directory, Turbopack)
- **Prisma pinned to stable 5.22.0** (NOT 8.x — the RC caused problems; keep it on 5.22.0)
- SQLite database via Prisma, at `prisma/dev.db`, working
- `DATABASE_URL="file:./dev.db"` in `.env`
- Prisma client helper at `src/app/lib/db.ts` (exports `prisma`)
- A resume-data helper at `src/app/lib/resume.ts` that reads the Resume row and JSON.parses the skills/experience/certs/education fields
- `prisma/seed.ts` exists and has been run — DB contains: 1 Resume row (my real data), 1 admin User, 1 sample Article
- Dependencies installed: `@prisma/client`, `prisma`, `bcryptjs`, `jose`, `tsx`, `@tiptap/*` (react, starter-kit, image, link, placeholder, pm)

### Prisma schema (current)
```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  passwordHash String
  createdAt DateTime @default(now())
}
model Resume {
  id String @id @default(cuid())
  name String
  title String
  location String
  lede String @default("")
  about String
  skills String @default("[]")      // JSON: [{category, items:[]}]
  experience String @default("[]")  // JSON: [{role, org, location, period, bullets:[]}]
  certs String @default("[]")       // JSON: [{code, name, issuer}]
  education String @default("[]")   // JSON: [{degree, school}]
  linkedin String?
  github String?
  email String?
  phone String?
  updatedAt DateTime @updatedAt
}
model Article {
  id String @id @default(cuid())
  slug String @unique
  title String
  excerpt String @default("")
  content String @default("")  // rich HTML from Tiptap editor
  coverImage String?           // path like /uploads/xyz.jpg
  published Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([published, createdAt])
}
```
(If the schema on disk doesn't yet have `lede`, `email`, `phone` on Resume, add them and run `npx prisma db push`.)

## My real resume data (for reference / seed)
- **Mohamad Halaweh** — Security Consulting Consultant, Accenture, Doha, Qatar
- BE Networks & Information Security Engineering, Princess Sumaya University for Technology
- Experience: Accenture (Consultant, May 2026–present; Analyst, Apr 2025–May 2026), Wizard Cyber (SIEM Engineer & IR 2024–2025; Security Engineer 2023–2024), Black Mountain (2022), Alpha-Hub (2022), Ericsson intern (2018)
- Key metrics: cut SIEM ingestion cost by $30K/month; raised cloud posture 50%→90%; 8/8 trainees passed SC-200; 30+ clients
- Certs: AZ-500, SC-300, SC-200, CCNA
- Links: linkedin.com/in/mohamad-halaweh, github.com/mkhalaweh
- **Privacy: phone and personal email should be OPTIONAL fields, editable in admin, blank by default (don't hardcode them into public pages).**

## The EXACT design to preserve (public resume page)
I have a specific design I want kept visually identical. It's a two-part page:

### Part 1 — "Newspaper" style resume (static, top of page)
- Fonts: Newsreader (serif, for headings/lede/pull-quotes), Inter (body), JetBrains Mono (terminal)
- Colors: `--paper:#F3F1EA; --ink:#1B2430; --muted:#5B6472; --green:#2F4A3E; --rule:#D8D3C4`
- Layout: max-width 760px, centered. A kicker line, big serif `h1` name, italic serif lede, horizontal rules, "Experience" section with entries (role/org/dates/description), an italic serif pull-quote for a key achievement, a "Credentials" section with bordered cert chips.

### Part 2 — Interactive fake terminal (floating widget)
A floating "Open terminal" launcher button (bottom-right). Clicking opens a draggable-feeling terminal window with working window controls (close/minimize/maximize + taskbar tab). It runs a tiny in-memory filesystem with real commands: `ls`, `cd`, `cat` (renders markdown), `tree`, `pwd`, `whoami`, `clear`, `help`, `open resume.pdf` (downloads PDF), plus tab-completion, command history (arrow keys), and easter eggs (`sudo hire`, `nmap`, `rm -rf`, `vim`, `sudo`, `sl`, `whoami --verbose`). Terminal colors: `--term-bg:#0B0F14; --accent:#E8A33D; --term-text:#DDE6EC; --term-line:#20282F`.

**I will paste the full original HTML/CSS/JS of this design separately — replicate it faithfully in React/Next.js.** (Ask me for it if I haven't pasted it.)

## KEY ARCHITECTURAL DECISIONS (already made — follow these)
1. **Terminal content is auto-generated FROM the resume database**, not hardcoded. One source of truth. When I edit my experience in admin, both the newspaper resume AND the terminal's filesystem (`experience/` tree, `about.txt`, `skills.txt`, cert files, etc.) update. Build a function that transforms the Resume DB row into the terminal's `fs` object.
2. **Contact info (phone/email) editable in admin, optional, blank = hidden** on public site.
3. **Articles match the newspaper look** (Newsreader serif, paper background), clean readable layout.
4. **Admin panel is just for me.** App-level login (email + bcrypt password + session via `jose` JWT in an httpOnly cookie). It'll ALSO sit behind Cloudflare Access later, but build the app login now as defense-in-depth.
5. Keep **Prisma 5.22.0** — do not upgrade to 8.x.
6. Server components read the DB directly; use server actions or route handlers for admin writes.

## What's left to build (in order)
1. **Public resume page** (`src/app/page.tsx`) — the newspaper design, rendered from the Resume DB row. Replace hardcoded content with DB fields.
2. **The terminal** — as a React client component, filesystem generated from the resume data (decision #1). Preserve all commands/easter eggs/window behavior. `resume.pdf` download should work (put a PDF in `public/`).
3. **Articles**: public list page (`/articles`) + individual article page (`/articles/[slug]`), newspaper-styled, reading published articles from DB.
4. **Admin auth**: `/admin/login` page, session with `jose` (httpOnly cookie), middleware protecting `/admin/*`. Verify against the User table (bcrypt). Include a way to set/change my password.
5. **Admin dashboard** (`/admin`): links to edit resume + manage articles.
6. **Resume editor** (`/admin/resume`): a form editing all Resume fields including the JSON arrays (experience, skills, certs, education) and optional contact fields. Saves to DB.
7. **Article editor** (`/admin/articles`): list/create/edit/delete articles. Rich editor using **Tiptap** (already installed) with headings, bold/italic, links, code blocks, and **image upload**. Image uploads saved to a folder (`/public/uploads` locally; will be a Docker volume later) — store only the path in DB. Validate file type + size, randomize filenames. Draft/publish toggle.

## Important constraints / gotchas
- **Persistence for later Docker deploy**: the SQLite DB file and uploads folder must become Docker volumes so they survive redeploys. (Not needed for local dev, but keep the code structured so paths are configurable via env.)
- **Security matters to me** (I'm a security consultant — this is a portfolio piece): validate uploads, parameterized queries (Prisma handles this), secrets in env vars, never commit `.env`, `dev.db`, or `/public/uploads`. Add these to `.gitignore`.
- Don't run `npm audit fix --force` (breaks things). Don't upgrade Prisma to RC.
- On Windows: file encoding matters — Prisma choked earlier on a BOM. Write files as clean UTF-8.
- I'm on Windows, Node v26, npm 11.

## How I want to work
Go step by step. Build one piece, let me run it and see it in the browser (`npm run dev`, localhost:3000), confirm it works, then move to the next. Explain what each part does — I like understanding the "why," not just pasting code. Tell me when you're working from assumptions vs. certainty.

## Start here
Begin with **Step 1 (public resume page from the DB)** and **Step 2 (the terminal)**. First, ask me to paste the original HTML design so you can replicate it faithfully. Then confirm the schema/seed have the `lede`/`email`/`phone` fields before building the pages.
