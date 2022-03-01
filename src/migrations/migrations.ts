import { pool } from "../dbOperations/Queries";
import * as env from "../utils/getEnv";
import * as ntwk from "../assets/Networks";

export default async function migrations() {


    let schema = `
    CREATE SCHEMA IF NOT EXISTS fuse_data;`;

    await pool.query(schema).catch((e: string) => {throw new Error(
        "error creating schema: " + e
    )});


    let tables = `
    CREATE TABLE IF NOT EXISTS fuse_data.cTokenData(
        chainid               INTEGER      NOT NULL,
        datetime              TIMESTAMP    NOT NULL,
        block                 BIGINT       NOT NULL,
        addr                  TEXT         NOT NULL,
        supply                DECIMAL(78),
        borrow                DECIMAL(78)
    );

    CREATE TABLE IF NOT EXISTS fuse_data.underlyingData(
        chainid               INTEGER      NOT NULL,
        datetime              TIMESTAMP    NOT NULL,
        block                 BIGINT       NOT NULL,
        addr                  TEXT         NOT NULL UNIQUE,
        ctoken                TEXT         NOT NULL, 
        supply                DECIMAL(78),
        borrow                DECIMAL(78)
    );

    CREATE TABLE IF NOT EXISTS fuse_data.poolMetadata(
        chainid               INTEGER      NOT NULL,
        datetime              TIMESTAMP    NOT NULL, 
        pool                  TEXT         NOT NULL,
        block                 BIGINT       NOT NULL,  
        ctokens               TEXT[]
    );

    CREATE TABLE IF NOT EXISTS fuse_data.cTokenMetadata(
        chainid               INTEGER      NOT NULL,
        address TEXT PRIMARY  KEY          NOT NULL,
        underlying            TEXT         NOT NULL,
        pool                  TEXT         NOT NULL,
        name                  TEXT         NOT NULL,
        symbol                TEXT         NOT NULL,
        lastUpdated           BIGINT       DEFAULT 0
    );
     

    CREATE TABLE IF NOT EXISTS fuse_data.underlyingMetadata(
        chainid               INTEGER      NOT NULL,
        underlying            TEXT         NOT NULL,
        ctokens               TEXT[]
    );
    


    CREATE TABLE IF NOT EXISTS fuse_data.networkMetadata(
        chainid TEXT PRIMARY  KEY          NOT NULL,
        lastupdated           BIGINT       NOT NULL,
        genesis_block         BIGINT 
    );
    
    
    CREATE TABLE IF NOT EXISTS fuse_data.eventMetadata(
        chainid               INTEGER      NOT NULL,
        ctoken                TEXT         NOT NULL,
        block                 BIGINT       NOT NULL
    );
    `
    
    await pool.query(tables);
    
    // unique constriants must be seperate in case of error
    let cPool = `ALTER TABLE fuse_data.poolMetadata ADD CONSTRAINT chainpool_unq UNIQUE(chainid,pool);`;
    let cToke = `ALTER TABLE fuse_data.cTokenMetadata ADD CONSTRAINT chainaddr_unq UNIQUE(chainid,address);`;
    let cUndr = `ALTER TABLE fuse_data.underlyingMetadata ADD CONSTRAINT chainunder_unq UNIQUE(chainid,underlying);`;
    await pool.query(cPool).catch((e: string) => {return});
    await pool.query(cToke).catch((e: string) => {return});
    await pool.query(cUndr).catch((e: string) => {return});

    // index creations must be seperate in case exists error is thrown
    let cAddr  = `CREATE INDEX IX_cTokenData_addr ON fuse_data.cTokenData(addr, number);`
    let cBlock = `CREATE INDEX IX_cTokenData_block ON fuse_data.cTokenData(block);`
    let uAddr  = `CREATE INDEX IX_underData_addr ON fuse_data.underData(addr);`
    let uBlock = `CREATE INDEX IX_underData_block ON fuse_data.underData(block);`;
    let pChain = `CREATE INDEX IX_poolMetadata_chain ON fuse_data.poolMetadata(chainid);`;
    let eData  = `CREATE INDEX IX_eventMetadata_token ON fuse_data.eventMetadata(chainid,ctoken)`;
    await pool.query(cAddr).catch((e: string)  => {return});
    await pool.query(cBlock).catch((e: string) => {return});
    await pool.query(uAddr).catch((e: string)  => {return});
    await pool.query(uBlock).catch((e: string) => {return});
    await pool.query(pChain).catch((e: string) => {return});   


    let chains = env.MAINNETS;
    let over = false;
    let count = 0;
    while(true) {
        let chain = chains[count];
        if(chain == undefined) break; 
        let chainId  = env.CHAINS[chain];
        let network = ntwk.networks[chainId];

        let str = `INSERT INTO fuse_data.networkMetadata(chainid, lastupdated, genesis_block)
        VALUES($1, $2, $3)
        ON CONFLICT(chainid) DO NOTHING;`;
        await pool.query(str, [chainId, network.genesisBlock-network.blocksIn30, network.genesisBlock]);

        count++;
    }
    return;
    
}
