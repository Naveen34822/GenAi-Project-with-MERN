FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the backend port
EXPOSE 5050

# Run the backend dev server (or start for prod)
CMD ["npm", "run", "dev"]
