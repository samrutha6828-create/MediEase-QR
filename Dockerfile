FROM node:20-bookworm-slim

WORKDIR /app

# Install native compilation dependencies required to build sqlite3 from source inside Linux glibc 2.36
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    openssl \
    sqlite3 \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Force npm to compile native modules (sqlite3) from source in container glibc environment
ENV npm_config_build_from_source=true

# Clean install dependencies and force rebuild of native modules
RUN npm ci && npm rebuild sqlite3 --build-from-source

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build Next.js production bundle
RUN npm run build

# Default Railway PORT
ENV PORT=3000
EXPOSE 3000

# Start production server with database push and seed fallback
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start -- -p ${PORT:-3000}"]
