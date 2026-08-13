FROM node:20

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
