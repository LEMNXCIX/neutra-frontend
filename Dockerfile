FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build with Vite / TanStack Start
COPY . ./
RUN npm run build:start

# ---------- Runtime image ----------
FROM node:22-alpine
WORKDIR /app

# Copy the generated client + Node server entry from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/serve-start.mjs ./scripts/serve-start.mjs
COPY --from=builder /app/scripts/serve-start-headers.mjs ./scripts/serve-start-headers.mjs
COPY --from=builder /app/scripts/serve-start-request.mjs ./scripts/serve-start-request.mjs
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the generated Node server on port 3001
CMD ["npm", "run", "start:start"]
