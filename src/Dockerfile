# Step 1: Use the official Node.js image to build the frontend application
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the frontend source code
COPY . .

# Step 5: Expose port 3000 (or your frontend port)
EXPOSE 8080

# Step 6: Start the frontend in development mode (for real-time updates)
CMD ["npm", "run", "dev"]
