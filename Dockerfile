# Use official Node.js 18 image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy application code
COPY . .

# Use official Nginx image for serving
FROM nginx:alpine

# Copy Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy Node.js app from builder
COPY --from=builder /app /app

# Install Node.js in Nginx image
RUN apk add --no-cache nodejs npm

# Expose port (Render assigns PORT, mapped to 8080)
EXPOSE 8080

# Start both Nginx and Node.js
CMD ["sh", "-c", "node /app/src/server.js & nginx -g 'daemon off;'"]