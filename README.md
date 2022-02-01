# Fuse-Historical-Data
 
##### ! use ts-node btw, hand/make compilation doesnt work !  
1) make sure in tsconfig.js to set "resolveJsonModule": true
2) include env file and export const env with required values 
in line 7 of: ./src/Index.ts
3) `npm install sequelize sequelize-cli pg pg-hstore`
4) `npx sequelize init`
5) `npx sequelize db:create node_test` (creates db)
6) `npx sequelize migration:generate --name add_tsdb_extension`


# TODO
1) change nomenclature []  
2) add liquidity and total borrow []
3) add endpoints []
4) enable upserts for existing data and adding new fields []
5) add underlying tokens 
6) (optional) use event logs to prevent unnecessary calls (this logic can be implemented in future fuse leverage position history) 
7) figure out arbitrum RPC issues
8) clean up network file, copy from sdk
9) (do 4th) comment and clean code