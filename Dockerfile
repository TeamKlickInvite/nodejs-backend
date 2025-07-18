# Base Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy only package files to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files into the container
COPY . .

# Expose port (match with your app's port)
EXPOSE 4000

# Start the server
CMD ["npm", "run", "dev"]
