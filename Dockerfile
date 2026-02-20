FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . ./
RUN npm run build

# ---------- Runtime image ----------
FROM node:20-alpine
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package*.json ./

# Expose the Next.js default port
EXPOSE 3000

ENV NODE_ENV=production

# Start the production server
CMD ["npm", "start"]
