FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies for build
COPY package*.json ./
RUN npm ci --production=false

# Copy sources and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --production=true

# Copy built app and public files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
