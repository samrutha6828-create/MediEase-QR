FROM node:20-bookworm-slim

WORKDIR /app

# Install openssl, sqlite3, and ca-certificates for Linux glibc compatibility
RUN apt-get update -y && apt-get install -y openssl sqlite3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies inside Linux environment
RUN npm ci

# Generate Prisma Client for Linux environment
RUN npx prisma generate

# Copy source files
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Default Railway PORT
ENV PORT=3000
EXPOSE 3000

# Start production server with database push and seed fallback
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start -- -p ${PORT:-3000}"]
