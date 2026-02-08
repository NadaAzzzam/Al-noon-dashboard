# Build and run the full-stack app (admin UI + API)
FROM node:20-alpine

WORKDIR /app

# Copy package files first (for better layer cache)
COPY package.json ./
COPY admin-dashboard/package.json admin-dashboard/package-lock.json ./admin-dashboard/
COPY server/package.json server/package-lock.json ./server/

# Copy source (excludes node_modules, dist, .env via .dockerignore)
COPY . .

# Install dependencies and build frontend + backend
RUN npm run build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
