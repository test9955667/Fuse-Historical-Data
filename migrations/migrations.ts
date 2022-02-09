import { pool } from "../src/Queries"
import assets from '../assets/NtwrkAssets.json'


export default async function migrations() {


    let schema = `
    CREATE SCHEMA IF NOT EXISTS fuse_data;`;

    await pool.query(schema).catch((e: string) => {throw new Error(
        "error creating schema: " + e
    )});


    let tables = `
    CREATE TABLE IF NOT EXISTS fuse_data.cTokenData(
        datetime TIMESTAMP NOT NULL,
        block    BIGINT NOT NULL,
        addr     TEXT NOT NULL UNIQUE,
        supply   DECIMAL(78),
        borrow   DECIMAL(78),
        liquid   DECIMAL(78),
    );

    CREATE TABLE IF NOT EXISTS fuse_data.underData(
        datetime    TIMESTAMP NOT NULL,
        block       BIGINT NOT NULL,
        addr        TEXT NOT NULL UNIQUE, 
        totalsupply DECIMAL(78),
        totalborrow DECIMAL(78),
        totalliquid DECIMAL(78),

    );

    CREATE TABLE IF NOT EXISTS fuse_data.poolMetadata(
        chain        INTEGER NOT NULL,
        address      TEXT    NOT NULL,
        block        BIGINT  NOT NULL,  
        timestamp    BIGINT  NOT NULL, 
        ctokens      TEXT[]  NOT NULL

    );

    CREATE TABLE IF NOT EXISTS fuse_data.cTokenMetadata(
        chain                INTEGER NOT NULL,
        address TEXT PRIMARY KEY  NOT NULL,
        underlying           TEXT NOT NULL,
        pool                 TEXT NOT NULL,
        name                 TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fuse_data.underMetadata(
        chain                     INTEGER NOT NULL,
        underlying                TEXT NOT NULL,
        ctokens                   TEXT[] NOT NULL
    );


    CREATE TABLE IF NOT EXISTS fuse_data.networkMetadata(
        network TEXT PRIMARY KEY    NOT NULL,
        block_last_updated   BIGINT NOT NULL,
        genesis_block        BIGINT 
    );
    `
    
    await pool.query(tables).catch((e: string) => {throw new Error(
        "error creating metadata tables: " + e
    )});


    let indexes = `
    CREATE INDEX IX_cTokenData_addr
    ON fuse_data.cTokenData(addr);

    CREATE INDEX IX_cTokenData_block
    ON fuse_data.cTokenData(block);
    
    CREATE INDEX IX_underData_addr
    ON fuse_data.underData(addr);

    CREATE INDEX IX_underData_block
    ON fuse_data.underData(block);
    
    CREATE INDEX IX_poolMetadata_chain
    ON fuse_data.poolMetadata(chain);
    `;
    
    await pool.query(indexes).catch((e: string) => {throw new Error(
        "error creating indexes: " + e
    )});
    
}
