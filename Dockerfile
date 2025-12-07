# Base image with Node and yarn
FROM node:18

# Set working directory
WORKDIR /app

# Copy package and yarn files first
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn

# Copy entire code
COPY . .

# Expose Payment Service port (make sure matches config.port, e.g. 5001)
EXPOSE 5001

# Start using babel-node + nodemon (same as main)
CMD ["yarn", "start"]
