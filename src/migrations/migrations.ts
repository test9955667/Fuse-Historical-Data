import { pool } from "../dbOperations/Queries"


export default async function migrations() {


    let schema = `
    CREATE SCHEMA IF NOT EXISTS fuse_data;`;

    await pool.query(schema).catch((e: string) => {throw new Error(
        "error creating schema: " + e
    )});


    let tables = `
    CREATE TABLE IF NOT EXISTS fuse_data.cTokenData(
        datetime              TIMESTAMP NOT NULL,
        block                 BIGINT NOT NULL,
        addr                  TEXT NOT NULL UNIQUE,
        supply                DECIMAL(78),
        borrow                DECIMAL(78),
        liquid                DECIMAL(78)
    );

    CREATE TABLE IF NOT EXISTS fuse_data.underData(
        datetime              TIMESTAMP NOT NULL,
        block                 BIGINT NOT NULL,
        addr                  TEXT NOT NULL UNIQUE, 
        totalsupply           DECIMAL(78),
        totalborrow           DECIMAL(78),
        totalliquid           DECIMAL(78)
    );

    CREATE TABLE IF NOT EXISTS fuse_data.poolMetadata(
        chain                 INTEGER NOT NULL,
        pool                  TEXT    NOT NULL,
        block                 BIGINT  NOT NULL,  
        timestamp             BIGINT  NOT NULL, 
        ctokens               TEXT[]  NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fuse_data.cTokenMetadata(
        chain                 INTEGER NOT NULL,
        address TEXT PRIMARY  KEY  NOT NULL,
        underlying            TEXT NOT NULL,
        pool                  TEXT NOT NULL,
        name                  TEXT NOT NULL
    );
     

    CREATE TABLE IF NOT EXISTS fuse_data.underMetadata(
        chain                 INTEGER NOT NULL,
        underlying            TEXT NOT NULL,
        ctokens               TEXT[] NOT NULL
    );
    


    CREATE TABLE IF NOT EXISTS fuse_data.networkMetadata(
        network TEXT PRIMARY  KEY    NOT NULL,
        block_last_updated    BIGINT NOT NULL,
        genesis_block         BIGINT 
    );
    
    
    CREATE TABLE IF NOT EXISTS fuse_data.eventMetadata(
        chain                 INTEGER NOT NULL,
        block                 BIGINT NOT NULL,
        ctoken                TEXT[] NOT NULL,  
    );
    `
    
    await pool.query(tables);
    
    // unique constriants must be seperate in case of error
    let cPool = `ALTER TABLE fuse_data.poolMetadata ADD CONSTRAINT chainpool_unq UNIQUE(chain,pool);`;
    let cToke = `ALTER TABLE fuse_data.cTokenMetadata ADD CONSTRAINT chainaddr_unq UNIQUE(chain,address);`;
    let cUndr = `ALTER TABLE fuse_data.underMetadata ADD CONSTRAINT chainunder_unq(chain, underlying);`;
    await pool.query(cPool).catch((e: string) => {return});
    await pool.query(cToke).catch((e: string) => {return});
    await pool.query(cUndr).catch((e: string) => {return});

    // index creations must be seperate in case exists error is thrown
    let cAddr  = `CREATE INDEX IX_cTokenData_addr ON fuse_data.cTokenData(addr);`
    let cBlock = `CREATE INDEX IX_cTokenData_block ON fuse_data.cTokenData(block);`
    let uAddr  = `CREATE INDEX IX_underData_addr ON fuse_data.underData(addr);`
    let uBlock = `CREATE INDEX IX_underData_block ON fuse_data.underData(block);`;
    let pChain = `CREATE INDEX IX_poolMetadata_chain ON fuse_data.poolMetadata(chain);`;
    await pool.query(cAddr).catch((e: string)  => {return});
    await pool.query(cBlock).catch((e: string) => {return});
    await pool.query(uAddr).catch((e: string)  => {return});
    await pool.query(uBlock).catch((e: string) => {return});
    await pool.query(pChain).catch((e: string) => {return});   
    
}
