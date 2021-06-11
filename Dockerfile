# syntax=docker/dockerfile:1
FROM node:16.3.0-slim
LABEL maintainer="La Chouquette"
LABEL description="API Gateway"

# Create app dir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Set build variables
ARG env=.env
# Set env variables
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0
ENV PORT 4000

# Bundle app source
COPY . .
# override .env with the appropriate file
COPY $env .env
RUN npm run build
RUN yarn cache clean

EXPOSE $PORT
CMD npm run start