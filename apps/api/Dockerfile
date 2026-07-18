FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder: Use turbo to prune the workspace
FROM base AS builder
# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Prune the workspace to only include the api app and its dependencies
RUN turbo prune @ziweiai/api --docker

# Installer: Install dependencies and build
FROM base AS installer
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# We set --frozen-lockfile=false just in case some local versions differ slightly
RUN pnpm install --frozen-lockfile=false

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@ziweiai/api

# Runner: Create the production image
FROM base AS runner
WORKDIR /app

# Add a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Switch to the non-root user
USER nestjs

# Copy the built artifacts and node_modules from the installer stage
COPY --from=installer --chown=nestjs:nodejs /app/ .

# API Port
EXPOSE 3001

# Limit memory via Node options to prevent OOM on a 2GB VPS
ENV NODE_OPTIONS="--max-old-space-size=400"

# Start the NestJS app
CMD ["node", "apps/api/dist/apps/api/src/main.js"]
