FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
ARG VITE_PUBLIC_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_STORE_LAT
ARG VITE_STORE_LNG
ARG VITE_API_URL
ENV VITE_PUBLIC_URL=${VITE_PUBLIC_URL}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
ENV VITE_STORE_LAT=${VITE_STORE_LAT}
ENV VITE_STORE_LNG=${VITE_STORE_LNG}
ENV VITE_API_URL=${VITE_API_URL}
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /backend
RUN apk add --no-cache python3 make g++
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Bogota
RUN apk add --no-cache tini tzdata \
 && cp /usr/share/zoneinfo/America/Bogota /etc/localtime \
 && echo "America/Bogota" > /etc/timezone
COPY backend/ /app/backend/
COPY --from=backend-deps /backend/node_modules /app/backend/node_modules
COPY --from=frontend-builder /frontend/dist /app/frontend/dist
RUN mkdir -p /data && chown -R node:node /data /app/backend
USER node
WORKDIR /app/backend
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
