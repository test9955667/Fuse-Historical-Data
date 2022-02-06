const express = require("express");
const Pool = require("pg").Pool;
import { clear, time } from "console";
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
 * // TODO: debug with sharad 
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
    chain:       number, 
    address:     string, 
    datetime:    string | number, 
    totalSupply: BigInt,
    totalBorrow: BigInt,
    liquidity:   BigInt,
    isCToken:    boolean
    ) {
        // 1) check if token exists 
        // 2) if not create table 
        // 3) add info to table at datetime
        // 4) add datetime as value for table name for last called
    let id = chain+address;
    
    await addTable(id);
    try {
        let append = `DO NOTHING`;

        if(!isCToken) { 
            append = `
            DO UPDATE SET (
                totalsupply = '`+id+`'.totalsupply + EXCLUDED.totalsupply, 
                totalborrow = '`+id+`'.totalborrow + EXCLUDED.totalborrow, 
                liquidity   = '`+id+`'.liquidity   + EXCLUDED.liquidity
            )`;
        } // TODO: ADD values for underlying


        let quer = `INSERT INTO
                        token_info.'`+id+`'(datetime, totalsupply, totalborrow, liquidity)
                        VALUES($1,$2,$3,$4)
                        ON CONFLICT(datetime) `+append+`
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
// --DONE
async function addTable(id: string) {
    try{
        let query = `CREATE TABLE IF NOT EXISTS
        token_info.`+id+` (
            datetime    TIMESTAMP PRIMARY KEY,
            totalsupply BIGINT,
            totalborrow BIGINT,
            liquidity   BIGINT,
            );`; // TODO: change token_info to token_info for prod
        let result = await pool.query(query);  
       } catch (err) {
           console.log(err);
        throw new Error("error creating table if not exists");
    }
}


// gets the last synced block for a given network
// --DONE 
export async function getBlockLastUpdated(network: number) {
    try{
        let str = `
        SELECT block_last_updated 
        FROM metadata.networkmetadata
        WHERE network = $1;`;
        let networkInfo = await pool.query(str, [network]);
        return networkInfo.rows[0].block_last_updated;
    } catch (err) {
        throw new Error("error retreiving last updated block");
    }
}


// sets the last synced block for a given network
// --DONE
export async function setBlockLastUpdated(network: number, block: BigInt) {
    try {
        await pool.query(`
            UPDATE metadata.networkmetadata
            SET block_last_updated = $1
            WHERE network = $2;`,
            [block, network]
        );
    } catch (err) {
        throw new Error("error updating last block for " + network);
    }
}

// gets underlying token corresponding to cToken
// --DONE
export async function getUnderlyingOfCToken(network: number, cToken: string) { 
    let res = await pool.query(`
        SELECT underlying FROM 
        metadata.ctokenmetadata
        WHERE token = $1;`,
        [network+cToken]
    );
    return res;
}

// gets the list of cTokens for underlying
// --DONE
export async function getCTokensOfUnderlying(network: number, underlying: string) {
    let str = `SELECT cTokens FROM metadata.underlyingmetadata WHERE idunderlying = $1`
    let query = await pool.query(str, [network+underlying]);
    return query;
}


// sets another cToken corresponding to underlying
// --DONE
export async function addCTokenToUnderlying(network: number, underlying: string, cToken: string) {
    let make = `
    INSERT INTO metadata.underlyingmetadata (idunderlying) VALUES($1)
    ON CONFLICT(idunderlying) DO NOTHING;`;
    await pool.query(make, [network+underlying]);

    let str = `
    UPDATE metadata.underlyingmetadata 
    SET ctokens = array_append(ctokens ,$2)
    WHERE idunderlying = $1;`;

    await pool.query(str ,[network+underlying, cToken]);

}
// 
// --DONE
export async function addUnderlyingToCToken(network: number, cToken: string, underlying: string) {
    let str = `
    INSERT INTO metadata.ctokenmetadata(token, underlying) VALUES($1, $2)
    ON CONFLICT(token) DO NOTHING;`
    await pool.query(str, [network+cToken, underlying]);
}


// --DONE
export async function clearRow(chain: number, token: string, timestamp: number | string) {
    let id = chain+token;

    let str = `
        SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE tablename = '`+id+`'
        );`;
    let res = await pool.query(str);
    if(!res.rows[0].exists) return;
        
    str = `
    SELECT EXISTS (
    SELECT * FROM token_info."`+id+`"
    WHERE datetime = '`+timestamp+`'
    );`;
    res = await pool.query(str);
    if(!res.rows[0].exists) return;
    
    str = `DELETE FROM token_info."`+id+`" WHERE datetime = $1;`;
    res = await pool.query(str, [timestamp]);

}



// total liqudiity 
// total borrows 
// price in eth 


app.listen(80, () => {
    console.log("server running port 5000")
});

