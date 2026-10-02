# syntax=docker/dockerfile:1
# Build for linux/amd64 (Contabo VPS)

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy value so Prisma doesn't crash during build — real DB is on the volume at runtime
ENV DATABASE_URL=file:///tmp/build-placeholder.db
# Generate Prisma client for the target platform
RUN npx prisma generate
# Produces .next/standalone/ (output: "standalone" in next.config.ts)
RUN npm run build
# Pre-compile seed to CJS so the runner needs no tsx/TypeScript toolchain
RUN npx tsc prisma/seed.ts \
      --module commonjs \
      --moduleResolution node \
      --esModuleInterop \
      --target ES2017 \
      --skipLibCheck \
      --outDir /tmp/seed-build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets — standalone omits these, must be added manually
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Public dir — same
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + seed script for startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Prisma CLI (contains migration engine for db push)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# Prisma client + native query engine
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Pre-compiled seed (plain JS, no TypeScript toolchain needed at runtime)
COPY --from=builder /tmp/seed-build/seed.js ./prisma/seed.js

# Symlink prisma CLI so __dirname resolves inside the package (needed for wasm lookup)
RUN mkdir -p /app/node_modules/.bin && \
    ln -sf /app/node_modules/prisma/build/index.js /app/node_modules/.bin/prisma

# bcryptjs — runtime dep used in seed.ts
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Persistent data volume: SQLite DB + uploads + resume PDF
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Remove npm and yarn — not needed at runtime, eliminates their CVEs from Trivy
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /opt/yarn-v1.22.22

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
