# syntax=docker/dockerfile:1

# ---- Build stage ----
# Use full Debian-based node (glibc) for reliable `sharp` prebuilt binaries
# used by the Vite image-optimization plugin during production builds.
FROM node:20 AS build
WORKDIR /app

# Install dependencies first (better layer caching).
# .npmrc (legacy-peer-deps=true) is respected automatically by npm ci.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Copy the rest of the source (includes .env / .env.local so Vite bakes
# VITE_* vars into the client bundle at build time).
COPY . .

# Produce the static SPA in /app/dist
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine AS serve

# Cloud Run sends traffic to $PORT (default 8080); our nginx listens on 8080.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
