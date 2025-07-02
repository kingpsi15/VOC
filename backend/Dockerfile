# Step 1: Use the official Node.js image as the base image
FROM node:16

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of the application
COPY . .

# Step 5: Expose the application port
EXPOSE 3001

# Step 6: Start the app
CMD ["npm", "run", "dev"]
