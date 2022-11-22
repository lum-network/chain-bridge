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

## Development

### Install dependencies

```bash
$ yarn install
```

### Configure the environment

You should have a .env file at the root level with the following entries (and the values of your choice)

```bash
# Must be any of development, mainnet, testnet
ENV=development
LUM_NETWORK_ENDPOINT=http://127.0.0.1:26657
COSMOS_NETWORK_ENDPOINT=https://rpc-cosmos.imperator.co
AKASH_NETWORK_ENDPOINT=https://rpc-akash.imperator.co
COMDEX_NETWORK_ENDPOINT=https://rpc-comdex.imperator.co
SENTINEL_NETWORK_ENDPOINT=https://rpc-sentinel.imperator.co
KICHAIN_NETWORK_ENDPOINT=https://rpc-kichain.imperator.co
OSMOSIS_NETWORK_ENDPOINT=https://rpc-osmosis.imperator.co
JUNO_NETWORK_ENDPOINT=https://rpc-juno.imperator.co
EVMOS_NETWORK_ENDPOINT=https://rpc-evmos.imperator.co
STARGAZE_NETWORK_ENDPOINT=https://rpc-stargaze.imperator.co

DATABASE_URL=postgresql://postgres:emulator@127.0.0.1:5432/postgres
REDIS_URL=redis://127.0.0.1:6379

INGEST_ENABLED=true

INGEST_BACKWARD_ENABLED=true

PUSH_NOTIF_ENABLED=true

DFRACT_SYNC_ENABLED=true
GOVERNANCE_SYNC_ENABLED=true
METRIC_SYNC_ENABLED=true
VALIDATOR_SYNC_ENABLED=true

# To enable faucet in testnet environment
FAUCET_MNEMONIC="my mnemonic phrase"
```

If you don't know what these params mean, leave them like this, they are preconfigured.

### Launch required third party services

The following services are required to run the service:

-   Elasticsearch 7+
-   Redis 5+
-   Lum Network node (RPC endpoint)

You can use the official Lum Network's testnet along the provided [docker-compose](tools/docker-compose.yml) file to run both Elasticsearch and Redis and get started in a minute:

```bash
docker-compose up
```

### Running the app

The implementation comes as a microservice, allowing for separate load integration by scaling specific components.

In order to have all parts started, you must run every single one in a separate terminal window.

As soon as you start the service, it will start ingesting all new blocks every 10 seconds and emitting the associated push notifications. Those blocks will be almost instantly accessible from the provided API endpoints.

The ingestion process for past blocks will only start after a couple of minutes in order to let the live synchronization ingest its first data. Only missing blocks and some of their neighbors will be ingested, meaning that a simple restart of the service will not trigger a full re-sync but might trigger only a small re-sync for missing block ranges.

```bash
# development
$ yarn start:api:dev
$ yarn start:sync:consumer:dev
$ yarn start:sync:scheduler:dev

# production mode
$ yarn start:api:prod
$ yarn start:sync:consumer:prod
$ yarn start:sync:scheduler:prod
```
