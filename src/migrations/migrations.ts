import { pool } from "../Index"

export default async function migrations() {
    let schema = `
    CREATE SCHEMA IF NOT EXISTS token_info;
    CREATE SCHEMA IF NOT EXISTS metadata;`;
    await pool.query(schema).catch((e: string) => {throw new Error(
        "error creating schemas"
    )});

    let meta = `
    CREATE TABLE IF NOT EXISTS metadata.ctokenmetadata(
        token TEXT PRIMARY KEY  NOT NULL,
        underlying         TEXT NOT NULL,
        name               TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS metadata.underlyingmetadata(
        idunderlying TEXT PRIMARY KEY    NOT NULL,
        ctokens                   TEXT[] NOT NULL
    );
    CREATE TABLE IF NOT EXISTS metadata.networkmetadata(
        network TEXT PRIMARY KEY    NOT NULL,
        block_last_updated   BIGINT NOT NULL,
        genesis_block        BIGINT 
    );`
    await pool.query(meta).catch((e: string) => {throw new Error(
        "error creating metadata tables"
    )});

    
}
