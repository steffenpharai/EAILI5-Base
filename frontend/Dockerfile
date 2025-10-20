# Stage 1: Base image with dependencies
FROM node:22-alpine AS base

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies with configuration to handle warnings
RUN npm config set fund false && \
    npm config set audit false && \
    npm install --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

EXPOSE 3000

# Stage 2: Development image (HOT-RELOAD)
FROM base AS development

# Don't copy code - it will be volume mounted for hot-reload
# The volume mount in docker-compose.yml provides the source code

# Set environment for hot-reload
ENV CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    FAST_REFRESH=true \
    WDS_SOCKET_PORT=0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Development command with hot-reload
CMD ["npm", "start"]

# Stage 3: Build stage for production
FROM base AS builder

# Accept build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_BASE_RPC_URL
ARG REACT_APP_BASE_SEPOLIA_RPC_URL
ARG REACT_APP_WALLET_CONNECT_PROJECT_ID

# Set as environment variables for React build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_BASE_RPC_URL=$REACT_APP_BASE_RPC_URL
ENV REACT_APP_BASE_SEPOLIA_RPC_URL=$REACT_APP_BASE_SEPOLIA_RPC_URL
ENV REACT_APP_WALLET_CONNECT_PROJECT_ID=$REACT_APP_WALLET_CONNECT_PROJECT_ID

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 4: Production image (nginx)
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
