import Web3 from 'web3';
import express from "express";
const Pool = require("pg").Pool;

const pool = new Pool( {
    user: "postgres",
    pass: "G8f9rQbBqp6eQRFtM5te3eaxyuP",
    host: "164.90.131.188",
    port: "0.0.0.0:5432",
    db:   "historical"
});


const app = express();

app.get("/api/ctoken/history/:chain-:addr-:start-:end", (req, res, next) => {
    try {
        console.log(req.params.chain);
        let data = getRangeSingle(
            req.params.chain,
            req.params.addr,
            req.params.start,
            req.params.end
        );
        res.json(data);
        next();
        return;
    } catch (err) {
        console.log(err);
    }
});











export async function getRangeSingle(
    chain: string,   // chainID 
    token: string,   // token address
    start: any,   // (OPTIONAL) beginning of query, leave 0 for beginning 
    end:   any,   // (OPTIONAL) end of query, leave 0 for current time
    ) {

    //console.log(chain);
    //console.log(token);

    try {
    if(start == 0) {
        let res1 = (await pool.query(`
            SELECT datetime FROM fuse_data.ctokendata
            WHERE (network = $1) AND (addr = $2)
            LIMIT 1;`,
            [chain, token])
        ).rows[0].datetime;
        start = Date.parse(res1).valueOf()/1000;
    }
    if(end == 0) {
        let res2 = (await pool.query(`
            SELECT datetime FROM fuse_data.ctokendata 
            WHERE (network = $1) AND (addr = $2)
            ORDER BY datetime DESC LIMIT 1;`,
            [chain, token])
        ).rows[0].datetime;
        end = Date.parse(res2).valueOf()/1000;
    }
    
    let query = (await pool.query(`SELECT *  
    FROM fuse_data.ctokendata
    WHERE 
    (network = $1) AND 
    (addr    = $2) AND 
    (datetime >= to_timestamp($3)) AND 
    (datetime <= to_timestamp($4));`,
    [chain, token, start, end])).rows;
    return query;
    } catch (err) {
        console.log(err);
        return err;
    }
    
    
}


const listener = app.listen(3000, () => {
    console.log('Your app is listening on port 3000')
});