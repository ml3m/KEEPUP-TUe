# ============================================================
# Multi-Stage Dockerfile for KEEPUP Study Planner
# Node.js + Express + SQLite + React Vite SPA
# ============================================================

# ── Stage 1: Build React Client ────────────────────────────
FROM node:20-bookworm-slim AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ── Stage 2: Install Server Dependencies ──────────────────
FROM node:20-bookworm-slim AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./

# ── Stage 3: Production Runner ─────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/keepup.db

# Create persistent database folder
RUN mkdir -p /app/data

# Copy built frontend
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy server application and dependencies
COPY --from=server-builder /app/server /app/server

WORKDIR /app/server

EXPOSE 3001

VOLUME ["/app/data"]

CMD ["npm", "start"]
