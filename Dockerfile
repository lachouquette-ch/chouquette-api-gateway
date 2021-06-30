# syntax=docker/dockerfile:1
FROM node:14.17.1-alpine
LABEL maintainer="La Chouquette"
LABEL description="API Gateway"
LABEL version="1.0"

# Create app dir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn

# Set env variables
ENV REDIS_HOST redis-tmp.jcloud-ver-jpc.ik-server.com
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
ENV PORT 4000

# Bundle app source
COPY . .
# Build and clean
RUN yarn build
RUN yarn cache clean

EXPOSE $PORT
CMD yarn start