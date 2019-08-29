import * as hapi from "hapi";
import * as schedule from "node-schedule";
import routes from './routes';
import {Sequelize} from 'sequelize-typescript';

import Block from "./models/block";
import Transaction from "./models/transaction";
import Account from "./models/account";
import Validator from "./models/validator";
import {SyncBlocks} from "./jobs/blocks";

const jobs = [];

const server: hapi.Server = new hapi.Server({
  host: 'localhost',
  port: 8000
});

server.route(routes);

async function initJobs(){
    // Blocks sync every 5 seconds
    jobs.push(schedule.scheduleJob('*/5 * * * * *', SyncBlocks));
}

async function start() {
    try {
        // Start database ORM
        const sequelize = new Sequelize({
            database: 'explorer',
            dialect: 'postgres',
            username: 'explorer',
            password: 'qevjgut9jw84',
            port: 3306,
            models: [Account, Block, Transaction, Validator],
            logging: false
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
