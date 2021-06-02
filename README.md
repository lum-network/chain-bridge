# Lum Network - Chain Bridge

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Backend service to access the Lum Network and search among blocks and transactions using Elasticsearch.

This service is used as an API by the [Lum Network Explorer](https://explorer.lum.network) (code hosted [here](https://github.com/lum-network/explorer)).

## Description

The service provides:

-   Rest API for serving content (ex: for explorer frontends)
-   Automatic caching of http requests (default 60s TTL) through Redis
-   Automatic blockchain data ingestion through async pipes (live ingestion as well as historical data ingestion)
-   Easy capabilities of scaling according to load requirements

## Deployment

`TBD`

## Development

### Install dependencies

```bash
$ yarn install
```

### Configure the environment

You should have a .env file at the root level with the following entries (and the values of your choice)

```bash
LUM-NETWORK-ENDPOINT=https://node0.testnet.lum.network/rpc

ELASTICSEARCH_HOST=127.0.0.1
ELASTICSEARCH_PORT=9200

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PREFIX=lm-bridge

API_ENABLED=true
API_PORT=3000

INGEST_ENABLED=true

PUSH_NOTIF_ENABLED=true

# To enable faucet in testnet environment
FAUCET_MNEMONIC="my mnemonic phrase"
```

If you don't know what these params mean, leave them like this, they are preconfigured.

### Launch required third party services

The following services are required to run the service:
- Elasticsearch 7+
- Redis 5+
- Lum Network node (RPC endpoint)

You can use the official Lum Network's testnet along the provided [docker-compose](./docker-compose.yml) file to run both Elasticsearch and Redis and get started in a minute:

```bash
docker-compose up
```

### Running the app

As soon as you start the service, it will start ingesting all new blocks every 10 seconds and emitting the associated push notifications. Those blocks will be almost instantly accessible from the provided API endpoints.

The ingestion process for past blocks will only start after a couple minutes in order to let the live syncronization ingest its first data. Only missing blocks and some of their neighbors will be ingested, meaning that a simple restart of the service will not trigger a full re-sync but might trigger only a small re-sync for missing block ranges.

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```
