# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm and required OpenSSL dependencies
RUN apk add --no-cache openssl openssl-dev
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm and required OpenSSL dependencies
RUN apk add --no-cache openssl openssl-dev
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all files
COPY . .

# Set environment variables for building
ENV NEXT_TELEMETRY_DISABLED 1


# Build the application
RUN pnpm build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm and required OpenSSL dependencies
RUN apk add --no-cache openssl openssl-dev
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV CONTAINER_RUNTIME docker

# Add a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Copy necessary files for the standalone app
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
ENV PORT 3000
EXPOSE ${PORT}

# Health check to verify app is running
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#   CMD wget -q -O - http://localhost:${PORT}/api/health || exit 1

CMD ["node", "server"] 