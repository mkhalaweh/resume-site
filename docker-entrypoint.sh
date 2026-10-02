#!/bin/sh
set -e

# Apply schema changes (idempotent — safe to run on every start)
echo "[entrypoint] Running prisma db push..."
node_modules/.bin/prisma db push --skip-generate

# Seed only on first boot — guard file lives on the persistent volume
SEED_MARKER=/app/data/.seeded
if [ ! -f "$SEED_MARKER" ]; then
  echo "[entrypoint] First boot — seeding database..."
  node prisma/seed.js
  touch "$SEED_MARKER"
  echo "[entrypoint] Seed complete."
else
  echo "[entrypoint] Already seeded — skipping."
fi

# Start the Next.js standalone server
echo "[entrypoint] Starting server on port ${PORT:-3000}..."
exec node server.js
