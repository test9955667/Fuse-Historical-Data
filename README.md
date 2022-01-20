# Fuse-Historical-Data
 
##### ! use ts-node btw, hand/make compilation doesnt work !  
1) make sure in tsconfig.js to set "resolveJsonModule": true
2) include env file and export const env with required values 
in line 7 of: ./src/Index.ts
3) `npm install sequelize sequelize-cli pg pg-hstore`
4) `npx sequelize init`
5) `npx sequelize db:create node_test` (creates db)
6) `npx sequelize migration:generate --name add_tsdb_extension`
7) 