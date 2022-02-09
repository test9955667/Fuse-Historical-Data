const express = require("express");
const Pool = require("pg").Pool;
import { clear, time } from "console";
import {env} from "../ecosystem.config";
const app = express();

app.use(express.json()); // 
export const pool = new Pool({
    user: env.user,
    password: env.pass,
    database: env.db,
    host: env.host,
    port: 5432,
    max: 100,
    connectionTimeoutMillis: 0,
    idelTimeoutMillis: 1000,
    allowExitOnIdle: true 
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
            `SELECT datetime FROM token_info."`+id+`" LIMIT 1;`
        )).rows[0].datetime;
        start = Date.parse(res).valueOf()/1000;
    }

    if(end == 0) {
        let res = (await pool.query(
            `SELECT datetime FROM token_info."`+id+`" ORDER BY datetime DESC LIMIT 1;`
        )).rows[0].datetime;
        end = Date.parse(res).valueOf()/1000;
    }
 
    let query = await pool.query(`SELECT *  
    FROM token_info."`+id+`"
    WHERE (to_timestamp($1) <= datetime) AND (datetime <= to_timestamp($2));`);
    
    
}


////////// INTERNAL FUNCTIONS ///////////


////////////// GETTERS /////////////////

// 1) getBlockLast Updated
// 2) getAllPools
// 3) getCTokensFromPool
// 4) getCTokensFromUnderlying 


// gets the last synced block for a given network
export async function getNetworkMetadata(chain: number) {
    let str = `
    SELECT * 
    FROM metadata.networkmetadata
    WHERE network = $1;`;
    try{
        return (await pool.query(str, [chain]).rows[0]);
    } catch (err) {
        throw new Error("error retreiving last updated block");
    }
}


// gets all ctokens from pool or all pools if pool is undefined
export async function getPoolMetadata(chain: number, pAddr: string | undefined) {
    let query = `SELECT * FROM fuse_data.poolMetadata WHERE chain = $1`;
    let append = `;`;
    
    if(pool != undefined) { append = `AND address = '`+pAddr+`';`}
    query += append;

    try{ return (await pool.query(query, [chain])).rows; }
    catch (err: any) {
        throw new Error("Error getting cTokensFromPool: " + err);
    }

}


export async function getCTokenMetadata(chain: number, cAddr: string | undefined) {
    let query = `SELECT * FROM fuse_data.cTokenMetadata WHERE chain = $1`;
    let append = `;`;

    if(cAddr != undefined) { append = `AND address = '`+cAddr+`';`}
    query += append;

    try{ return (await pool.query(query, [chain])).rows; }
    catch (err: any) {
        throw new Error("Error getting cTokensFromPool: " + err);
    }

}

export async function getUnderlingMetadata(chain: number, uAddr: string | undefined) {
    
}

////////////// SETTERS /////////////////

// adds pool and tokens to poolmetadata
export async function addPool(
    chain: number, 
    pAddr: string, 
    block: number,
    stamp: number, 
    cToks: string[]
    ) {
    let id = chain+pAddr;
    let query = `
    INSERT INTO fuse_info.poolmetadata(chain, address, block, timestamp, ctokens)
    VALUES ($1, $2, $3, $4, $5)`;
    try {
        await pool.query(query, [chain, pAddr, block, stamp, cToks]);
    } catch (err: any) {
        throw new Error("Error adding pool: " + err);
    }

}

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

    await addTable(chain, address);

    try {
        let append = `DO NOTHING`;

        if(!isCToken) { 
            append = `
            DO UPDATE SET
                totalsupply = "`+id+`".totalsupply + EXCLUDED.totalsupply, 
                totalborrow = "`+id+`".totalborrow + EXCLUDED.totalborrow, 
                liquidity   = "`+id+`".liquidity   + EXCLUDED.liquidity
            `;
        } // TODO: ADD values for underlying


        let quer = `INSERT INTO
                        token_info."`+id+`"(datetime, totalsupply, totalborrow, liquidity)
                        VALUES(to_timestamp($1),$2,$3,$4)
                        ON CONFLICT(datetime) 
                        `+append+`
                    ;`

        let response = await pool.query(
            quer,
            [datetime, totalSupply, totalBorrow, liquidity]
        );
        
    } catch (err) {
        console.log(err);
        throw new Error("error writing to " + id);
    }
}

export async function addCTokenMetadata(
    chain: number, 
    cAddr: string, 
    under: string, 
    pAddr:  string, 
    name:  string) {
        let query = `
        INSERT INTO fuse_info.cTokenMetadata(chain, address, underlying, pool, name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (address) DO NOTHING;`;

        try {
            await pool.query(query, [chain, cAddr, under, pAddr, name]);
        } catch (err: any) {
            throw new Error("error adding cTokenMetadata: " + err);
        }
}

export async function addUnderlyingMetaData(
    chain: number,
    uAddr: string,
    pAddr: string[]) {
        

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

export async function getAllCTokens() {

    let str = `SELECT * FROM metadata.ctokenmetadata`;
    let query = await pool.query(str);
    
    return query.rows;
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
    try{
        /*
    
    let str1 = `
        SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE tablename = `+id+`
        );`;
    let res = await pool.query(str1);
    if(!res.rows[0].exists) return;
        
    let str2 = `
    SELECT EXISTS (
    SELECT * FROM token_info."`+id+`"
    WHERE datetime = '`+timestamp+`'
    );`;
    res = await pool.query(str2);
    if(!res.rows[0].exists) return;
    */
    // TODO: delete the next row 
    let str3 = `DELETE FROM token_info."`+id+`" WHERE datetime > to_timestamp($1);`; // TDOO: test
    let res = await pool.query(str3, [timestamp]);
    return res;
    } catch (err) {
        return;
    }
}


// total liqudiity 
// total borrows 
// price in eth 


app.listen(80, () => {
    console.log("server running port 5000")
});

