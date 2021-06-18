# syntax=docker/dockerfile:1
FROM node:16.3.0-alpine
LABEL maintainer="La Chouquette"
LABEL description="API Gateway"
LABEL version="1.0"

# Create app dir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Set env variables
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
ENV PORT 4000

# Bundle app source
COPY . .
# Build and clean
RUN npm run build
RUN yarn cache clean

EXPOSE $PORT
CMD npm run start