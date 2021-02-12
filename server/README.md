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
PUSHER_APP_ID=825937
PUSHER_KEY=TO_REPLACE
PUSHER_SECRET=TO_REPLACE
```

If you don't know what these params mean, leave them like this, they are preconfigured.

## Running the required architecture
The best option is to mirror remote services, type the following commands each in separate terminal.

You should see a bunch of logs, meaning that you are ready for the next step.

If you see any error, the pod name is probably outdated. Please do a `kubectl get pods` in order to get the correct naming.

```bash
$ kubectl port-forward chain-redis-59c864c46b-pdrxx 6379:6379
$ kubectl port-forward chain-elasticsearch-74cd4b666-hbpx6 9200:9200
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
