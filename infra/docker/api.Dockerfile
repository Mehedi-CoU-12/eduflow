FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json prettier.config.mjs ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @eduflow/types build
RUN pnpm --filter @eduflow/api db:generate
RUN pnpm --filter @eduflow/api build

FROM base AS migrate
WORKDIR /app
COPY --from=builder /app /app
CMD ["pnpm", "--filter", "@eduflow/api", "db:deploy"]

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
