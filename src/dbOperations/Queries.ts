const express = require("express");
const Pool = require("pg").Pool;
import { clear, time } from "console";
import {env} from "../../ecosystem.config";
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

export async function getRangeSingle(
    chainid: string,   // chainid 
    token: string,   // token address
    start: number,   // (OPTIONAL) beginning of query, leave 0 for beginning 
    end:   number,   // (OPTIONAL) end of query, leave 0 for current time
    ) {

    //console.log(chainid);
    //console.log(token);

    try {
    if(start == 0) {
        let res1 = (await pool.query(`
            SELECT datetime FROM fuse_data.ctokendata
            WHERE (chainid = $1) AND (addr = $2)
            LIMIT 1;`,
            [chainid, token])
        ).rows[0].datetime;
        start = Date.parse(res1).valueOf()/1000;
    }
    if(end == 0) {
        let res2 = (await pool.query(`
            SELECT datetime FROM fuse_data.ctokendata 
            WHERE (chainid = $1) AND (addr = $2)
            ORDER BY datetime DESC LIMIT 1;`,
            [chainid, token])
        ).rows[0].datetime;
        end = Date.parse(res2).valueOf()/1000;
    }
    
    let query = (await pool.query(`SELECT *  
    FROM fuse_data.ctokendata
    WHERE 
    (chainid = $1) AND 
    (addr    = $2) AND 
    (datetime >= to_timestamp($3)) AND 
    (datetime <= to_timestamp($4));`,
    [chainid, token, start, end])).rows;
    return query;
    } catch (err) {
        console.log(err);
        return err;
    }
    
    
}


////////// INTERNAL FUNCTIONS ///////////


////////////// GETTERS /////////////////

// 1) getBlockLast Updated
// 2) getAllPools
// 3) getCTokensFromPool
// 4) getCTokensFromUnderlying 


// gets the last synced block for a given chainid
export async function getchainidMetadata(chainid: number) {
    let str = `
    SELECT * 
    FROM fuse_data.chainidmetadata
    WHERE chainid = $1;`;
    try{
        return (await pool.query(str, [chainid]).rows[0]);
    } catch (err) {
        throw new Error("error retreiving last updated block");
    }
}


// gets all ctokens from pool or all pools if pool is undefined
export async function getPoolMetadata(chainid: number, pAddr: string | undefined) {
    let query = `SELECT * FROM fuse_data.poolmetadata WHERE chainid = $1`;
    let append = `;`;
    
    if(pAddr != undefined) { append = ` AND pool = ${pAddr};`}
    query += append;
    try{ return (await pool.query(query, [chainid])).rows; }
    catch (err: any) {
        throw new Error("Error getting cTokensFromPool: " + err);
    }

}


export async function getCTokenMetadata(chainid: number, cAddr: string | undefined) {
    let query = `SELECT * FROM fuse_data.cTokenMetadata WHERE chainid = $1`;
    let append = `;`;

    if(cAddr != undefined) { append = `AND address = ${cAddr};`}
    query += append;

    try{ return (await pool.query(query, [chainid])).rows; }
    catch (err: any) {
        throw new Error("Error getting cTokensFromPool: " + err);
    }
    return;

}


export async function getBlockLastUpdated(chainid: number) {
    let query = `SELECT lastupdated FROM fuse_data.chainidMetadata WHERE chainid = $1;`;
    try{ return (await pool.query(query, [chainid])).rows[0].lastupdated; }
    catch (err: any) { throw new Error("Error getting block last updated: " + err); }
}

// gets underlying token corresponding to cToken
// --DONE
export async function getUnderlyingOfCToken(chainid: number, cToken: string) { 

    let res = await pool.query(`
        SELECT underlying FROM 
        fuse_data.ctokenmetadata
        WHERE token = $1;`,
        [chainid+cToken]
    );
    
    return res;
}

// gets the list of cTokens for underlying
// --DONE
export async function getCTokensOfUnderlying(chainid: number, underlying: string) {

    let str = `SELECT cTokens FROM fuse_data.underlyingmetadata WHERE underlying = $1`
    let query = await pool.query(str, [chainid+underlying]);
    
    return query;
}

export async function getAllCTokens() {

    let str = `SELECT * FROM fuse_data.ctokenmetadata`;
    let query = await pool.query(str);
    
    return query.rows;
}


////////////// SETTERS /////////////////

// adds pool and tokens to poolmetadata
export async function addPool(
    chainid: number, 
    pAddr: string, 
    block: number,
    stamp: number, 
    cToks: string[]
    ) {

    let query = `
    INSERT INTO fuse_data.poolmetadata(chainid, datetime, pool, block, ctokens)
    VALUES ($1, to_timestamp($2), $3, $4, $5)
    ON CONFLICT(chainid,pool) DO NOTHING
    ;`;
    try {
        let q = await pool.query(query, [chainid,stamp,pAddr,block,cToks]);
        return q;
    } catch (err: any) {
        throw new Error("Error adding pool: " + err);
    }

}

// adds token data to token
export async function addTokenData(
    chainid:     number, 
    datetime:    number,
    block:       number,
    address:     string,
    underlying:  string, 
    totalSupply: BigInt,
    totalBorrow: BigInt
    ) {

    try {     
        let under = `
            INSERT INTO fuse_data.underlyingdata(chainid,datetime,block,addr,ctoken,supply,borrow)
            VALUES($1,to_timestamp($2),$3,$4,$5,$6,$7)

            ON CONFLICT(chainid,datetime,addr,ctoken)
                DO UPDATE SET
                supply = underlyingdata.supply + EXCLUDED.supply, 
                borrow = underlyingdata.borrow + EXCLUDED.borrow;`;

        await pool.query(
            under, 
            [chainid,datetime,block,underlying,address,totalSupply,totalBorrow]);


        let quer = `
            INSERT INTO fuse_data.ctokendata(chainid, datetime, block, addr, supply, borrow)
                VALUES($1,to_timestamp($2),$3,$4,$5,$6)

                ON CONFLICT(chainid,block,addr)
                    DO UPDATE SET
                    supply = EXCLUDED.supply,
                    borrow = EXCLUDED.borrow;`;

        await pool.query(
            quer,
            [chainid,datetime,block,address,totalSupply,totalBorrow]);
        
    } catch (err) {
        console.log(err);
        throw new Error(`error writing to ${underlying} and/or ${address}`);
    }
}

// TODO: test
export async function setCTokenMetadata(
    chainid:  number, 
    cAddr:  string, 
    under:  string, 
    pAddr:  string, 
    name:   string,
    symbol: string,
    startblock: number
    ) {
        let query = `
        INSERT INTO fuse_data.cTokenMetadata(chainid, address, underlying, pool, name, symbol, startblock)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(chainid,address) DO NOTHING;`;

        try {
            await pool.query(query, [chainid, cAddr, under, pAddr, name, symbol, startblock]);
            return;
        } catch (err: any) {
            throw new Error("error adding cTokenMetadata: " + err);
            return;
        }
}

export async function setCTokenLastUpdated(chainid: number, cAddr: string, block: number) {
    let str = `
    UPDATE fuse_data.ctokenmetadata
    SET lastupdated = $1
    WHERE (chainid = $2) 
    AND (address = $3)
    ;`;

    try {
        await pool.query(str, [block, chainid, cAddr]);
        return;
    } catch (err) {
        console.log(err);
    }
}

// sets the last synced block for a given chainid
// --DONE
export async function setBlockLastUpdated(chainid: number, block: BigInt) {

    try {
        await pool.query(`
            UPDATE fuse_data.chainidmetadata
            SET lastupdated = $1
            WHERE chainid = $2;`,
            [block, chainid]
        );
        return;
    } catch (err) {
        throw new Error("error updating last block for " + chainid);
    }
    
}

// sets another cToken corresponding to underlying
// --DONE
export async function addCTokenToUnderlying(chainid: number, underlying: string, cToken: string) {
    let arr: string[] = [];
    let str = `
    INSERT INTO fuse_data.underlyingmetadata (chainid, underlying, ctokens) VALUES($1, $2, $3)
    ON CONFLICT(chainid,underlying) DO NOTHING;
    `;
    let str2 = `
    UPDATE fuse_data.underlyingmetadata 
    SET ctokens = array_append(ctokens, $3)
    WHERE chainid = $1 AND underlying = $2;
    `;
    try {
        await pool.query(str, [chainid, underlying, arr]);
        await pool.query(str2, [chainid, underlying, cToken]);
        return;
    } catch (err) {
        console.log(err);
        return;
    }


} 
// --DONE
export async function addUnderlyingToCToken(chainid: number, cToken: string, underlying: string) {

    let str = `
    INSERT INTO fuse_data.ctokenmetadata(token, underlying) VALUES($1, $2)
    ON CONFLICT(token) DO NOTHING;`
    await pool.query(str, [chainid+cToken, underlying]);
    
}


// --DONE
export async function clearRow(chainid: number, token: string, timestamp: number | string) {
    let id = chainid+token;
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

