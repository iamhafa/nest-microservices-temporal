# Base image
FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install dependencies
FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Build application
FROM dependencies AS build
COPY . .

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

RUN pnpm nest build ${APP_NAME}

# Production
FROM node:20-alpine AS production
WORKDIR /app

# Set environment variables
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production

# Copy dependencies and build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/${APP_NAME} ./dist/apps/${APP_NAME}
COPY package.json ./

# Run application
CMD node dist/apps/${APP_NAME}/main.js
