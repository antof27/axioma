# Stage 1: Build Frontend React App
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies list
COPY frontend/package.json ./

# Install packages
RUN npm install

# Copy configuration and sources
COPY frontend/vite.config.js frontend/postcss.config.js frontend/tailwind.config.js frontend/index.html ./
COPY frontend/src ./src

# Build production assets (Vite config is set to output to ../backend/public)
RUN npm run build

# Stage 2: Express Server & SQLite Database
FROM node:20-slim
WORKDIR /app

# Install native dependencies for building node-sqlite3 (just in case)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend package setup
COPY backend/package.json ./
RUN npm install --omit=dev

# Copy backend source files
COPY backend/server.js backend/db.js ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/backend/public ./public

# Setup persistent directory for SQLite database file
ENV DATABASE_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 3000

# Start application
CMD ["node", "server.js"]
