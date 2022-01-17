--testSchema.sql
--Author: 0xNosedrop

DROP TABLE IF EXISTS "cToken_info";
CREATE TABLE "cToken_info"(
    cToken_code	VARCHAR (10),
    cToken 		TEXT
);

DROP TABLE IF EXISTS "underlying_info";
CREATE TABLE "underlying_info"(
    underlying_code	VARCHAR (10),
    underlying 		TEXT
);


--Schema for token liquidity tables
DROP TABLE IF EXISTS "token_liquidity";
CREATE TABLE "token_liquidity"(
    time            TIMESTAMP NOT NULL,
    liq_eth_uint18  BIGINT  
);

