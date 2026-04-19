# See docker/backend.Dockerfile for the rationale behind dropping the
# `# syntax=` directive and parameterising NODE_IMAGE.
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY apps ./apps

ENV DATABASE_URL=postgresql://ci:ci@localhost/ci
ENV NEWS_DATABASE_URL=file:./ci.db
RUN npm ci

ARG APP_PATH
ARG PORT=5173
ENV APP_PATH=${APP_PATH}
WORKDIR /app/${APP_PATH}

EXPOSE ${PORT}
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
