# Dropped `# syntax=docker/dockerfile:1.6` — it forces a pull of
# docker.io/docker/dockerfile:1.6 and we don't use any 1.6-only feature
# (heredocs, --mount=type=cache/secret). Default BuildKit frontend suffices.
#
# NODE_IMAGE is a build-arg so restricted networks can point it at an
# internal mirror (e.g. harbor-docker.<org>/whitelist/node:22-alpine).
# Overridden from .env.ci-local via docker-compose build args.
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
ARG APP_PATH
WORKDIR /app
# wget (healthcheck) + C toolchain (native npm deps) + openssl (Prisma's
# libquery_engine links libssl at runtime). Detect the base distro so the
# same Dockerfile works against Alpine (node:22-alpine) *and* Debian
# (node:22, node:22-slim) — the Harbor whitelist sometimes only mirrors
# one of the two.
RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache wget python3 make g++ openssl; \
    else \
      apt-get update && \
      apt-get install -y --no-install-recommends \
        wget python3 make g++ openssl ca-certificates && \
      rm -rf /var/lib/apt/lists/*; \
    fi

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
