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
# Generate Prisma client for the target platform
RUN npx prisma generate
# Produces .next/standalone/ (output: "standalone" in next.config.ts)
RUN npm run build

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
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
# Prisma client + native query engine
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# tsx runtime for seed.ts execution
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

# bcryptjs — runtime dep used in seed.ts
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Persistent data volume: SQLite DB + uploads + resume PDF
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
