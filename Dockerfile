# This dockerfile specifies the environment the production
# code will be run in, along with what files are needed
# for production

# Use an official Node.js runtime as the base image
FROM --platform=linux/arm64 node:iron-bookworm-slim

# Use a non-interactive frontend for debconf
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Create a user within the container
RUN useradd -m exsys_frontend_user

# Copy .next, public, package.json and package-lock.json and Config directory
COPY .next/ ./.next/
COPY public/ ./public/
COPY package*.json ./
COPY config/ ./config/

# Make sure the directory belongs to the non-root user
RUN chown -R exsys_frontend_user:exsys_frontend_user /app

# Switch to user for subsequent commands
USER exsys_frontend_user

# Install production dependencies
RUN npm install --omit=dev

# Expose the port Next.js runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]