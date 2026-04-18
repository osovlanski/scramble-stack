# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
ARG APP_PATH
WORKDIR /app
RUN apk add --no-cache wget python3 make g++

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
CMD ["npm", "run", "dev"]
