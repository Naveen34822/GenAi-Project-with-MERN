FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the frontend port
EXPOSE 5173

# Run the frontend dev server and bind to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
