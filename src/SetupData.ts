import * as env from '../assets/Networks'
import * as db from './Queries';
import Web3 from 'web3';
import {Contract} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

type  network  = env.network;
const MAINNETS = env.MAINNETS;
const CHAINS   = env.CHAINID;
const NETWORKS = env.networks;
const dirAbi:  AbiItem[] = require('../assets/abis/DIRV1.json');
const cmpAbi:  AbiItem[] = require('../assets/abis/COMPV1.json');
const tokAbi:  AbiItem[] = require('../assets/abis/TOKV1.json');

// Gets the relevant metadata of the database to use in memory, 
// If there is missing data, then it is first populated into the db 
export default async function() {
    let i = 0; 
    let ntwk: network =  NETWORKS[CHAINS[MAINNETS[i]]];
    const web3 = new Web3(new Web3.providers.HttpProvider(ntwk.rpc));

    await setAllPools(web3, ntwk);
    // get and or set all pools in database
}

type blockPool = {
    block: number
    pool:  string
}

type poolResult = {
    chain:     number
    pool:   string
    block:     number
    timestamp: number
    ctokens:   string[]
}

type dirResult = {
    name:            string,
    creator:         string,
    comptroller:     string,
    blockPosted:     number,
    timestampPosted: number,
}

type cTokenResult = {
    chain:      number
    token:      string
    underlying: string
    pool:       string
    name:       string
}

type underResult = {
    underlying: string
    cTokens:    string[]
}

// Sets all pools that arent already in the database
// @return blockPool[] object for historic search to use for chain-queries
async function setAllPools(web3: Web3, ntwk: network) {
    console.log("setting all current pools with data");
    const dir: Contract = new web3.eth.Contract(dirAbi, ntwk.dirAddr);
    let poolBlockList: blockPool[] = [];

    // list pools and ctokens of pool data in db
    let data: poolResult[] = (await db.getPoolMetadata(ntwk.id, undefined));
    // helper for symDiff
    let dbPools = data.map(d => d.pool);

    // list fuse pools stored in directory
    let pList: dirResult[] = await dir.methods.getAllPools().call();
    // helper for symDiff
    let chPools = pList.map(p => p.comptroller);
    
    // gets all pools in the directory, but not yet in db
    pList = pList.filter((a) => !dbPools.includes(a.comptroller));
    data.filter(d => !chPools.includes(d.pool));
    for(let {pool, block, timestamp} of data) {
        poolBlockList.push({block, pool});
        let res: dirResult = ({
            name:            "",
            creator:         "",
            comptroller:     pool,
            blockPosted:     block,
            timestampPosted: timestamp,
        });
        pList.push(res);
    }


    for(let i = 0; i < pList.length; i++) { 
        let pRes = pList[i];
        // gets metadata of pool
        const pool:  Contract = await new web3.eth.Contract(cmpAbi, pRes.comptroller);
        const cToks: string[] = await pool.methods.getAllMarkets().call();
    
        let stamp = (await web3.eth.getBlock(pRes.blockPosted)).timestamp;
        stamp = typeof(stamp) == 'number' ? stamp : Number(stamp);
     
        poolBlockList.push({block: pRes.blockPosted, pool: pRes.comptroller});
        
        let res = await db.addPool(ntwk.id, pRes.comptroller, pRes.blockPosted, stamp, cToks);
    }

    poolBlockList.sort((a, b) => a.block - b.block);
    console.log(poolBlockList);
    // TODO: here

}


// Sets all cTokens and corresponging metadata that doesnt already in the database
async function setAllTokens(web3: Web3, ntwk: network, cTokens: string[], pools: blockPool[]) {
    console.log("setting all underlying metadata");
    let unders: underResult[] = [];
    let data:  cTokenResult[] = (await db.getCTokenMetadata(ntwk.id, undefined));
    let tokens = data.map(d => d.token);

    // symmetric difference of the two lists to check chain
    // @dev its ok to pause the sync if needed here,
    // thats what this whole function is for 
    tokens = tokens.filter(a => !cTokens.includes(a))
    .concat(cTokens.filter(a => !tokens.includes(a)));

    // adds cToken data to db and prepares lists of cTokens for each underlying
    tokens.forEach((async (cAddr: string) => {
        const cToken: Contract = await new web3.eth.Contract(tokAbi, cAddr);
        const name:   string   = await cToken.methods.name().call();
        const under:  string   = await cToken.methods.underlying().call();
        const pool:   string   = await cToken.methods.pool().call();

        await db.addCTokenMetadata(ntwk.id, cAddr, under, pool, name);

        let underMeta = unders.find(u => u.underlying == under);
        if (underMeta) {
            underMeta.cTokens.push(cAddr);
        } else {
            unders.push({ underlying: under, cTokens: [cAddr] });
        }
    }));

    // adds the lists for each underling to the db
    unders.forEach(async (under) => { 
        await db.addUnderlyingMetaData(ntwk.id, under.underlying, under.cTokens);
    });
    
}

  


