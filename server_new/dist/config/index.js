"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const path = require("path");
const SequelizeStatic = require("sequelize");
class Database {
    constructor() {
        this._basename = path.basename(module.filename);
        let dbConfig = {
            database: 'explorer',
            username: 'explorer',
            password: 'qevjgut9jw84',
            host: '127.0.0.1',
            port: 3306,
            dialect: 'postgres',
        };
        // @ts-ignore
        this._sequelize = new SequelizeStatic(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
        this._models = {};
        glob.sync('**/*.ts', {
            cwd: __dirname
        }).forEach(file => {
            let model = this._sequelize.import(path.join(__dirname, file));
            this._models[model.name] = model;
        });
        Object.keys(this._models).forEach((modelName) => {
            if (typeof this._models[modelName].associate === "function") {
                this._models[modelName].associate(this._models);
            }
        });
    }
    getModels() {
        return this._models;
    }
    getSequelize() {
        return this._sequelize;
    }
    initTables() {
        return this._sequelize.sync({ force: false })
            .catch(err => {
            throw err;
        });
    }
}
const database = new Database();
database.initTables();
exports.models = database.getModels();
exports.sequelize = database.getSequelize();
//# sourceMappingURL=index.js.map