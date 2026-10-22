# ==========================================
# Giai đoạn 1: Build Frontend từ mã nguồn
# ==========================================
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV CI=false
RUN npm run build

# ==========================================
# Giai đoạn 2: Runtime Backend & Redis
# ==========================================
FROM node:20-bookworm-slim
WORKDIR /app

# Cài đặt redis-server chạy ngầm
RUN apt-get update && apt-get install -y redis-server && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies backend (chỉ production)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy mã nguồn backend
COPY backend/ ./backend/

# Copy bản build tĩnh của frontend từ Giai đoạn 1
COPY --from=frontend-builder /app/frontend/build ./frontend/build

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Khởi động redis-server ngầm rồi khởi chạy backend Node.js
CMD redis-server --daemonize yes && node index.js
