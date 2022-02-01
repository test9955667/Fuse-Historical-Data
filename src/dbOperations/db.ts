const Pool = require("pg").Pool;
const cfg = require ("../../ecosystem.config");

type pool = {
    username: string,
    password: string,
    database: string,
    hostAddr: string,
    port: number 

}

export const pool: pool = new Pool({
    username: cfg.user,
    password: cfg.pass,
    database: cfg.db,
    host: cfg.host,
    port: 5432
});

module.exports = pool;
