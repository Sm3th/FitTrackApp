FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl openssl-dev
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache curl openssl openssl-dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh

RUN mkdir -p /data && chmod 777 /data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/fittrack.db

EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --skip-generate --accept-data-loss && node dist/server.js"]
