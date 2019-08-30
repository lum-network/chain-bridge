import * as dotenv from 'dotenv';
import * as hapi from "hapi";
import * as schedule from "node-schedule";
import routes from './routes';
import {Sequelize} from 'sequelize-typescript';

import Block from "./models/block";
import Transaction from "./models/transaction";
import Account from "./models/account";
import Validator from "./models/validator";
import {SyncBlocks} from "./jobs/blocks";
import Migration from "./models/migration";

const jobs = [];

const server: hapi.Server = new hapi.Server({
    host: 'localhost',
    port: 8000,
    routes: {
        cors: {
            origin: ['*']
        }
    }
});

server.realm.modifiers.route.prefix = '/api/v1';
server.route(routes);

async function initJobs(){
    // Blocks sync every 15 seconds
    jobs.push(schedule.scheduleJob('*/15 * * * * *', SyncBlocks));
}

async function start() {
    try {
        // Read env config
        dotenv.config();

        // Start database ORM
        // @ts-ignore
        const sequelize = new Sequelize({
            database: process.env.DB_NAME,
            dialect: process.env.DB_DIALECT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            models: [Account, Block, Migration, Transaction, Validator],
            logging: false,
            timezone: '+02:00'
        });

        // Launch jobs
        await initJobs();

        // Start HAPI
        await server.start();

        // Echo it out
        console.log('Server running at:', server.info.uri);
    }
    catch(error){
        console.error(error);
    }
}

start();
