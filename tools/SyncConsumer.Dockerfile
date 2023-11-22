FROM node:18.17.0

RUN apt-get update
RUN apt-get upgrade -y

# Install API
WORKDIR /usr/src/api

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY src src/
RUN mkdir output

RUN yarn install
COPY . .
RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start:sync:consumer:prod" ]
