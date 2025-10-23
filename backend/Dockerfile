# Use the official Node.js runtime as the base image
FROM node:18-bullseye-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and prisma folder to the working directory
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Define the command to run the application
# First run migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]