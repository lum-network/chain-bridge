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
import {ProcessWaitingMigration} from "./jobs/migration";
import {Request} from "hapi";
import {ResponseToolkit} from "hapi";
import {response} from "./utils/http";
import {SyncValidators} from "./jobs/validators";

const jobs = [];

const server: hapi.Server = new hapi.Server({
    host: 'localhost',
    port: 8000,
    routes: {
        cors: {
            origin: ['*']
        },
        validate: {
            failAction: async (request: Request, h: ResponseToolkit, err?: Error) => {
                // @ts-ignore
                return response(h, err.validation, err.message, 400).takeover();
            }
        }
    }
});

server.realm.modifiers.route.prefix = '/api/v1';
server.route(routes);

async function initJobs(){
    // Blocks sync every 15 seconds
    jobs.push(schedule.scheduleJob('*/15 * * * * *', SyncBlocks));

    // Sync validators
    jobs.push(schedule.scheduleJob('*/15 * * * * *', SyncValidators));

    // Migrations every minute
    jobs.push(schedule.scheduleJob('* * * * *', ProcessWaitingMigration));
}

async function start() {
    try {
        // Read env config
        await dotenv.config();

        // Start database ORM
        // @ts-ignore
        new Sequelize({
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

        /*server.ext('onPreResponse', function(request, h) {
            var response = request.response;
            //@ts-ignore
            const error = response.error || response.message;
            server.log([ 'error' ], error);
            return h.continue;
        });*/

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
