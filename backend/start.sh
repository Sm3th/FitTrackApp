#!/bin/sh
echo "=== FitTrack starting ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: $DATABASE_URL"

echo "=== Prisma db push ==="
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss
echo "=== Prisma done, launching node ==="

exec node dist/server.js
