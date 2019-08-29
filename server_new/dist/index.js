"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const hapi = require("hapi");
const schedule = require("node-schedule");
const routes_1 = require("./routes");
const sequelize_typescript_1 = require("sequelize-typescript");
const block_1 = require("./models/block");
const transaction_1 = require("./models/transaction");
const account_1 = require("./models/account");
const validator_1 = require("./models/validator");
const blocks_1 = require("./jobs/blocks");
const jobs = [];
const server = new hapi.Server({
    host: 'localhost',
    port: 8000
});
server.route(routes_1.default);
function initJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        // Blocks sync every 5 seconds
        jobs.push(schedule.scheduleJob('*/5 * * * * *', blocks_1.SyncBlocks));
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read env config
            dotenv.config();
            // Start database ORM
            // @ts-ignore
            const sequelize = new sequelize_typescript_1.Sequelize({
                database: process.env.DB_NAME,
                dialect: process.env.DB_DIALECT,
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT,
                models: [account_1.default, block_1.default, transaction_1.default, validator_1.default],
                logging: false
            });
            // Launch jobs
            yield initJobs();
            // Start HAPI
            yield server.start();
            // Echo it out
            console.log('Server running at:', server.info.uri);
        }
        catch (error) {
            console.error(error);
        }
    });
}
start();
//# sourceMappingURL=index.js.map