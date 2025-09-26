# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=dev --chown=nextjs:nodejs /app/dist ./dist
COPY --from=dev --chown=nextjs:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/uploads /app/sessions /app/logs
RUN chown -R nextjs:nodejs /app/uploads /app/sessions /app/logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
