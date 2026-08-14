FROM node:20-bookworm-slim

WORKDIR /app

# Native compilation tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    openssl \
    sqlite3 \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Force sqlite3 to compile INSIDE this Linux container
ENV npm_config_build_from_source=true
ENV npm_config_sqlite3_binary_host_mirror=

# Clean npm cache so Railway cannot reuse a bad native sqlite3 binary
RUN npm cache clean --force

# Install dependencies
RUN npm ci --build-from-source

# Explicitly rebuild sqlite3 inside this container
RUN npm rebuild sqlite3 --build-from-source

# This MUST succeed during the Docker build
RUN node -e "const sqlite3 = require('sqlite3'); console.log('SQLITE3_NATIVE_LOAD_SUCCESS')"

# Copy application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Railway networking
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start Next.js
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start -- -p ${PORT:-3000}"]