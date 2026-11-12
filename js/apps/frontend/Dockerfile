FROM node:24.18.0-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline
RUN pnpm --filter @railswitch/frontend build

FROM caddy:2-alpine

COPY apps/frontend/docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/frontend/dist /srv
COPY apps/frontend/docker/config.js /srv/config.js

EXPOSE 80
