FROM node:20-alpine

# M-C: non-root user — 降低容器逃逸風險
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Install backend deps (production only)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy program-sync Vanilla JS app (no build step needed)
COPY program-sync/ ./program-sync/

# 賦予 non-root user 存取權
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["node", "backend/src/index.js"]
