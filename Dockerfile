FROM node:20-bookworm-slim

WORKDIR /app

# STEP 2 — Native Build Dependencies
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

# STEP 4 — Clean Install & Build sqlite3 From Source
COPY package*.json ./
COPY prisma ./prisma/

ENV npm_config_build_from_source=true

RUN npm install --build-from-source && \
    npm rebuild sqlite3 --build-from-source

# STEP 5 — Verify sqlite3 Native Module Loads Inside Container
RUN node -e "require('sqlite3'); console.log('SQLITE3_NATIVE_LOAD_SUCCESS')"

# STEP 6 — Copy Application & Generate Prisma Client
COPY . .

RUN npx prisma generate
RUN npm run build

# STEP 7 — Network & Port Configuration
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# STEP 9 — Startup Command
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm start -- -p ${PORT:-3000}"]
