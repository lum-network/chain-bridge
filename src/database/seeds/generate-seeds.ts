// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client } = require('pg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const sql = fs.readFileSync('src/database/seeds/dump.sql').toString();

const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

const execute = async (query) => {
    try {
        await client.connect(); // gets connection
        await client.query(query); // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    } finally {
        await client.end(); // closes connection
    }
};

// execute proposals_depositors seed
execute(sql).then((result) => {
    try {
        if (result) {
            console.log('Seeding data to database...');
        }
    } catch (error) {
        console.log('error during seeding phase', error);
    }
});
