FROM node:lts-alpine AS base

# Stage 1: Install web dependencies
FROM base AS web-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build the web application
FROM base AS web-builder
ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app
COPY . .
COPY --from=web-deps /app/node_modules ./node_modules
RUN corepack enable pnpm && pnpm run vercel-build

CMD ["pnpm", "start"]