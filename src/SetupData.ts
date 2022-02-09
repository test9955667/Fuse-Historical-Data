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


    // get and or set all pools in database
}

type blockPool = {
    block: number
    pool:  string
}

type poolResult = {
    chain:     number
    address:   string
    block:     number
    timestamp: number
    ctokens:   string[]
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

async function setAllPools(web3: Web3, ntwk: network) {
    console.log("setting all current pools with data");
    let poolBlockList: blockPool[] = [];

    let data: poolResult[] = (await db.getPoolMetadata(ntwk.id, undefined));
    let pools = data.map(d => d.address);
    let ctokens = data.map(d => d.ctokens); 

    const dir = await new web3.eth.Contract(dirAbi, ntwk.dirAddr);
    const pList: string[] = await dir.methods.getAllPools().call();

    // symmetric difference of the two lists to check chain
    pools = pools.filter(a => !pList.includes(a))
    .concat(pList.filter(a => !pools.includes(a)));

    pools.forEach((async (pAddr: string) => {
        const pool:  Contract = await new web3.eth.Contract(cmpAbi, pAddr);
        const block: number   = await pool.methods.blockposted().call();
        const cToks: string[] = await pool.methods.getCTokensFromPool(pAddr).call();
    
        let stamp = (await web3.eth.getBlock(block)).timestamp;
        stamp = typeof(stamp) == 'number' ? stamp : Number(stamp);

        poolBlockList.push({block: block, pool: pAddr});
        ctokens.concat(cToks);
        await db.addPool(ntwk.id, pAddr, block, stamp, cToks);
    }));

    poolBlockList.sort((a, b) => a.block - b.block);
    // TODO: here

}

// 
async function setAllTokens(web3: Web3, ntwk: network, cTokens: string[], pools: blockPool[]) {
    console.log("setting all underlying metadata");
    let unders: underResult[] = [];
    let data:  cTokenResult[] = (await db.getCTokenMetadata(ntwk.id, undefined));
    let tokens = data.map(d => d.token);

    // symmetric difference of the two lists to check chain
    tokens = tokens.filter(a => !cTokens.includes(a))
    .concat(cTokens.filter(a => !tokens.includes(a)));

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
            unders.push({
                underlying: under,
                cTokens:    [cAddr]
            });
        }
    }));

    unders.forEach(async (under) => { 
        await db.addUnderlyingMetaData(ntwk.id, under.underlying, under.cTokens);
    });
    
}

  


