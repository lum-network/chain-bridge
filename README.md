#### Sandblock Chain Explorer

------------

👋 Welcome to the official Sandblock Chain Explorer repository!

⚠️ This is beta software. Some features may not work as intended at the very beginning.

🤓 All contributions are more than welcome! Feel free to fork the repository and create a Pull Request!

------------

##### Project Architecture
The repository contains both client and server codes. We might split them later.
###### Client
The client is a react web application, it fetches information from the explorer API and directly from the chain RPC endpoints, depending on the required type.
###### Server
The server is a Hapi.Js (Node.JS + Typescript) application, connected to a PostgreSQL database in production (can be anything else thanks to Sequelize).

Main objective is to extends chain daemon features via the server: blocks & transactions history, link between validator and block, Sandblock's migration process etc...
Some calls just query the chain RPC and add missing informations (f.e validator<=>block).
We offer realtime features by sending events to Pusher.

##### Development
On both projects, we are using Yarn as package manager.
Then, you can install the dependencies by typing
> $ yarn

###### Client

Before starting the client you have to define the .env file, example config:

```bash
NODE_PATH=src/
REACT_APP_CHAIN_HOST=https://shore.sandblock.io
REACT_APP_CHAIN_COSMOS_PORT=/cosmos
REACT_APP_CHAIN_TENDERMINT_PORT=/tendermint
REACT_APP_PUSHER_APP_KEY=<MYPUSHERKEY>
REACT_APP_PUSHER_APP_CLUSTER=<MYPUSHERCLUSTER>
```

Then you can start the project with
> $ yarn start

###### Server

Before starting the server you have to define the .env file, example config:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=explorer
DB_PASSWORD=explorer
DB_NAME=explorer
DB_DIALECT=postgres
ETHERSCAN_API_KEY=<MYETHAPIKEY>
PUSHER_APP_ID=<MYPUSHERAPPID>
PUSHER_KEY=<MYPUSHERAPPKEY>
PUSHER_SECRET=<MYPUSHERAPPSECRET>
```

Then you can start the project in dev mode (auto reload on change) with
> $ yarn start-dev

Or in production with
> $ yarn start
