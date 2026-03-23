FROM node:20-alpine

WORKDIR /app

# Install backend deps (production only)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy program-sync Vanilla JS app (no build step needed)
COPY program-sync/ ./program-sync/

EXPOSE 3001

CMD ["node", "backend/src/index.js"]
