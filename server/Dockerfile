# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# ffmpeg/ffprobe used by fluent-ffmpeg to compress video uploads to webm.
RUN apk add --no-cache ffmpeg

COPY package.json package-lock.json ./
RUN npm ci

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 3002
# Applies any pending migrations before starting - safe to run on every boot,
# it's a no-op once the DB is already at the latest migration.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
