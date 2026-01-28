# Development Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Development command (overridden in docker compose)
CMD ["npm", "run", "dev", "--", "--host"]

