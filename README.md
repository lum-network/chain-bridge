## Description

Backend for Sandblock's blockchain explorer.

Built on the great Nest.JS with ElasticSearch as database engine, and Redis for caching purposes.

It provides
* Rest API for serving content to explorer frontends
* Automatic caching of http requests (60s TTL) through Redis
* Automatic blockchain ingestion through async pipes, running every 10s (and thus syncing the blocks emitted in the last 10s)
* Easy capabilities of scaling

## Installation

```bash
$ yarn install
```

## Configure the development environment
You should have a .env file at the root level with the following entries
```bash
ELASTICSEARCH_HOST=chain-elasticsearch
ELASTICSEARCH_PORT=9200
REDIS_HOST=chain-redis
REDIS_PORT=6379
PORT=3000
MODE=DEV
INGEST_BLOCKS_ENABLED=false
INGEST_BLOCKS_LENGTH=19
INGEST_TRANSACTIONS_ENABLED=false
```

If you don't know what these params mean, leave them like this, they are preconfigured.

## Running the required architecture
The project introduce a docker compose file. You can run it and it will bootstrap the required services.

```bash
docker-compose -f docker-compose.yml up
```

## Running the app

```bash
# development (watch mode)
$ yarn start:dev

# development (normal mode)
$ yarn start

# production mode
$ yarn start:prod
```
