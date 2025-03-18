FROM node:18-alpine AS base
RUN npm i -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i
COPY . .

FROM base AS dev
ENV NODE_ENV=development
ENTRYPOINT ["pnpm", "start:dev"]

FROM base AS build
ENV NODE_ENV=production
RUN pnpm build

FROM node:18-alpine AS prod
ENV NODE_ENV=production
EXPOSE 3005
WORKDIR /app
RUN npm i -g pnpm
COPY --from=build /app/.env ./.env
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm i --prod
ENTRYPOINT ["pnpm", "start"]
