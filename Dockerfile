# Root Dockerfile for MediEase QR backend
# Place this file at the root of the MediEase-QR project.

FROM node:20-alpine
WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy the backend source code
COPY backend ./

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
