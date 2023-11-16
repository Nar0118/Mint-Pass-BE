# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose a port on which the server will run (replace 3000 with the actual port your server listens on)
EXPOSE 3000

# Define the command to start the server
CMD ["yarn", "dev"]