const express = require("express");
const Pool = require("pg").Pool;
import {env} from "../ecosystem.config";
const app = express();

app.use(express.json()); // 
const pool = new Pool({
    user: env.user,
    password: env.pass,
    database: env.db,
    host: env.host,
    port: 5432
});


///////// ENDPOINT FUNCTIONS //////////

/**
 * 
 * @param chain chainID to search token data for
 * @param token token address to query 
 * @param start beginning of time range to query UNIX | timestamp, LEAVE 0 for all time
 * @param end   end of time range to query UNIX | timestamp, LEAVE 0 for NOW
 * @param interval NOT IN USE | interval to query in seconds
 * @returns JSON of token data
 */
async function getRangeSingle(
    chain: string,   // chainID 
    token: string,   // token address
    start: number,   // (OPTIONAL) beginning of query, leave 0 for beginning 
    end: number,     // (OPTIONAL) end of query, leave 0 for current time
    interval: number // time interval of raw data, can be used for smoothing lowest denom is "half"(30min),
    ) {
    let id = chain+token;
    if(start == 0) {

        let res = (await pool.query(
            `SELECT datetime FROM token_info.`+id+` LIMIT 1;`
        )).rows[0].datetime;
        start = Date.parse(res).valueOf()/1000;
    }

    if(end == 0) {
        let res = (await pool.query(
            `SELECT datetime FROM token_info.`+id+` ORDER BY datetime DESC LIMIT 1;`
        )).rows[0].datetime;
        end = Date.parse(res).valueOf()/1000;
    }
    
    // TODO: test if this works 
    let teststring = (`SELECT *  
    FROM token_info.${`chain+token
    `} WHERE (to_timestamp(${`start`}) <= datetime) AND (datetime <= to_timestamp(${`end`}));`);

    let query = await pool.query(`SELECT *  
    FROM token_info.`+chain+token+
    ` WHERE (to_timestamp(`+start+`) <= datetime) AND (datetime <= to_timestamp(`+end+`));`);
    console.log(query);
    
}


////////// INTERNAL FUNCTIONS ///////////

// adds token data to token
export async function addCTokenData(
    chain: number, 
    address: string, 
    datetime: string | number, 
    totalSupply: BigInt,
    totalBorrow: BigInt,
    liquidity: BigInt,
    isCToken: boolean
    ) {
        // 1) check if token exists 
        // 2) if not create table 
        // 3) add info to table at datetime
        // 4) add datetime as value for table name for last called
    let id = chain+address;
    
    await addTable(id);
    try {
        let append = `DO NOTHING`;
        if(!isCToken) { append = ``;} // TODO: ADD values for underlying
        let quer = `INSERT 
                        token_info.`+id+`(datetime, totalsupply, totalborrow, liquidity)
                        VALUES($1,$2,$3,$4)
                        ON CONFLICT(datetime) DO NOTHING
                        ;`

        let response = await pool.query(
            quer,
            [datetime, totalSupply, totalBorrow, liquidity]
        );
        console.log(response);
    } catch (err) {
        console.log(err);
        throw new Error("error writing to " + id);
    }
}


// sets new table for token data
async function addTable(id: string) {
    try{
        let query = `CREATE TABLE IF NOT EXISTS
        token_info.`+id+` (
            datetime TIMESTAMP NOT NULL,
            totalsupply BIGINT,
            totalborrow BIGINT
            );`; // TODO: change token_info to token_info for prod
        let result = await pool.query(query);  
       } catch (err) {
           console.log(err);
        throw new Error("error creating table if not exists");
    }
}


// gets the last synced block for a given network
export async function getBlockLastUpdated(network: number) {
    try{
        let networkInfo = await pool.query(
            `SELECT * FROM metadata.networkmetadata`
        );
        for(let i = 0; i < networkInfo.rows.length; i++) {
            if(networkInfo.rows[i].network == network) {
                return networkInfo.rows[i];
            } 
        }
        throw new Error("network not found");

    } catch (err) {
        throw new Error("error retreiving last updated block");
    }
}

async function test() {
  
}
test();
// sets the last synced block for a given network
export async function setBlockLastUpdated(network: number, block: BigInt) {
    try {
        await pool.query(
            `UPDATE metadata.networkmetadata
             SET block_last_updated = $1
             WHERE network = $2;`,
             [block, network]
        );
    } catch (err) {
        throw new Error("error updating last block for " + network);
    }
}

// gets underlying token corresponding to cToken
export async function getUnderlyingOfCToken(network: number, cToken: string) { 
    let res = await pool.query(
        `SELECT underlying FROM 
        metadata.ctokenmetadata
        WHERE token = $1+$2;`,
        [network, cToken]
    );
    return res;
}


// sets another cToken corresponding to underlying
export async function addCTokenToUnderlying(network: number, underlying: string, cToken: string) {
    let id = network+underlying;

    await pool.query(
        `INSERT INTO metadata.underlyingmetadata(idunderlying, cTokens)
        VALUES($1, '{$2}');`,
        [id, cToken]
    );

}

export async function addUnderlyingToCToken(network: number, cToken: string, underlying: string) {
    let id = network+cToken;
    await pool.query(`
        INSERT INTO metadata.ctokenmetadata(token, underlying)
        VALUES($1, $2);`,
    [id, underlying]);
}


// gets the list of cTokens for underlying
export async function getCTokensOfUnderlying(network: number, underlying: string) {
    let id = network+underlying;
    let query = await pool.query(
        `SELECT cTokens FROM metadata.underlyingmetadata
        WHERE idunderlying = $1`,
        [id]
    );
    return query.rows[0].cTokens;
}

// TODO: reset latest block for all networks
async function resetTimeline() {
 
}


// total liqudiity 
// total borrows 
// price in eth 


app.listen(80, () => {
    console.log("server running port 5000")
});

