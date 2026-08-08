# ─── Multi-Stage Production Dockerfile for SentraOps ─────────────────────────

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY src/models/schema.prisma ./src/models/

RUN npm ci
COPY . .
RUN npx prisma generate --schema=src/models/schema.prisma

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/worker ./worker

EXPOSE 5000

CMD ["node", "src/index.js"]
