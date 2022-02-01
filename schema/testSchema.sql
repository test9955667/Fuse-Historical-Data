--testSchema.sql
--Author: 0xNosedrop


CREATE TABLE IF NOT EXISTS "cToken_info"(
    cToken_code	VARCHAR (10),
    cToken 		TEXT
);


CREATE TABLE IF NOT EXISTS "underlying_info"(
    underlying_code	VARCHAR (10),
    underlying 		TEXT
);


--Schema for token liquidity tables
DROP TABLE IF EXISTS "token_info";
CREATE TABLE "token_info"(
    time            TIMESTAMP NOT NULL,
    liq_eth_uint18  BIGINT  
);

CREATE TABLE IF NOT EXISTS "token_metadata"(
    table        TEXT
    lastBlock    BIGINT
    UNDERLYING   TEXT
)


