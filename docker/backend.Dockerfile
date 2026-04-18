# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
ARG APP_PATH
WORKDIR /app
# openssl is required by Prisma 5's libquery_engine on Alpine (libssl3).
RUN apk add --no-cache wget python3 make g++ openssl

COPY package.json package-lock.json ./
COPY shared ./shared
COPY apps ./apps

ENV DATABASE_URL=postgresql://ci:ci@localhost/ci
ENV NEWS_DATABASE_URL=file:./ci.db
RUN npm ci

ARG APP_PATH
ENV APP_PATH=${APP_PATH}
WORKDIR /app/${APP_PATH}

EXPOSE 3000 3001 3002
# Apply schema to the mounted DB volume (idempotent) before starting
# the dev server. Prisma 7 dropped --skip-generate; push stays cheap.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run dev"]
