FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the WebSocket server
RUN npm run ws:build

# Expose the port the app runs on
EXPOSE 8080

# Start the WebSocket server
CMD ["npm", "run", "ws:start"]