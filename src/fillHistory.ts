import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { Contract } from "web3-eth-contract";
import { networkMemory } from "./networkMemory";
import * as ntwk from "./ChainParse";

import { CHAINID, networks } from "../assets/Networks"

import * as db from './Index';
import { time } from "console";


let networkNames: number[] = [];
let networkMap: Map<number, networkMemory> = new Map();

let chain = 0;

// Type of token data to enter
type tokenEntry = {
    network: number,
    name: string,
    supply: BigInt,
    borrow: BigInt,
    liquidity: BigInt,
}

type contractInfo = {
    abi: AbiItem[],
    addr: string
}

type network = { network: keyof typeof CHAINID }

entry([{network: "ETHEREUM"}], false);

async function entry(networks: network[], exactTime: boolean) {

    // TODO: IMPORTANT flush the underlying db at the most recent block if reload!
    
    for(let i = 0; i < networks.length; i++) {
        let chain = CHAINID[networks[i].network];
        let lensInfo: contractInfo = ntwk.getLensInfo(chain);
        let dirInfo = ntwk.getDirInfo(chain);
        let comptrollerInfo = ntwk.getComptrollerInfo(chain);
        let cTokenInfo = ntwk.getCTokenInfo(chain);
        let genesis = ntwk.getGenesis(chain);
        let blocks = ntwk.getBlocks(chain);
        let lastUpdated = await db.getBlockLastUpdated(chain);
        let web3 = new Web3(new Web3.providers.HttpProvider(ntwk.getUrl(chain)));
        networkNames.push(chain);
        let network = new networkMemory(chain, genesis, blocks, dirInfo, lensInfo, comptrollerInfo, cTokenInfo, lastUpdated, web3);
        network.poolsBlockList = await getAllPools(network); // TODO: test
        networkMap.set(chain, network);
        return;
        await sync(chain, exactTime);
    }



}

/**
 * @dev Syncs the  inline with the current block, 
 * then passes 
 */
async function sync(chain: number, exactTime: boolean) { //TODO; add chain spec here and reference it instead of literal

// ============ CONTRACT INSTANCES =========== // 
    
    let mem  = networkMap.get(chain);
    if(!mem) {return}

    let dir     = mem.directory;
    let lens    = mem.lens;

// ===== ORDER POOLS BY BLOCK DEPLOYED ====== //
    let poolsBlockList = await getAllPools(mem);

// ======== LOAD POOLS/TOKENS EFFICIENTLY ========= // 
    let poolContractMap = mem.poolContractMap; // key: cTokenAddress, value cTokenInstance
    // let cTokenEvents = new Map(); // events branch
    let underlyingMap: Map<string, string> = new Map(); // key: cTokenAddress, value: underlyingAddress
// =============  INITIAL TIME VALUES =========== //  
    let poolCount = 0;
    let previous  = Number((await mem.web3.eth.getBlock(mem.GENESIS)).timestamp);
    let currBlock = mem.lastUpdated;
    console.log(currBlock);

    let endBlock  = await mem.web3.eth.getBlockNumber();

// ============ GET HISTORIC LIQUIDITY ========== //
    while(currBlock < endBlock) {
        if(!exactTime) { currBlock += mem.BLOCKS; } 
        else {
            let currTime = (await mem.web3.eth.getBlock(currBlock)).timestamp;
            currBlock++;
            if(currTime < previous + 1800 ) { continue; } 
            previous += 1800; 
        } 
        while(currBlock > poolsBlockList[poolCount]) { poolCount++; }
        let timestamp = (await mem.web3.eth.getBlock(currBlock)).timestamp;
        lens.defaultBlock = currBlock;

        /*///////////////////////////////////////////////////
        Iterates through pool to write data foreach cToken
        /////////////////////////////////////////////////*/
        for(let j = 0; j < poolCount; j++) {
            // gets and or sets pool instance 
            let pAddr = mem.poolBlockMap.get(poolsBlockList[j]);
            if(pAddr == undefined) { continue; }
            let pool = await getAndSetPool(pAddr, mem);

            /*///////////////////////////////////////////////////
            Iterates through cTokens to write data for currBlock
            /////////////////////////////////////////////////*/
            let cTokens = await pool.methods.getAllMarkets().call(); 
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];

                // gets and or sets ctoken instance and underlying address
                let token = await getCTokenInfo(cAddr, mem);
                let under = await getAndSetUnderlying(cAddr, mem, token);
                if(under == undefined) { continue; }

                // get block-specific data for cToken 
                token.defaultBlock = currBlock;
                try {
                let supply = await token.methods.totalSupply().call();
                let borrow = await token.methods.totalBorrows().call();
                let liquid = await token.methods.getCash().call();
                // write data to cToken
                db.addCTokenData(chain, cAddr, timestamp, supply, borrow, liquid, true);
                // write data to underyling 
                db.addCTokenData(chain, under, timestamp, supply, borrow, liquid, false);
                } catch(e) {
                    throw new Error(`${cAddr} failed to load`);
                }

            }
           
        }
        // Sets block last updated in db in case sync stops early
        await db.setBlockLastUpdated(chain, BigInt(currBlock));
        // Sets end as current block in case query time went into new block
        endBlock = await mem.web3.eth.getBlockNumber();
    }
    
}

    /*//////////////////////////////////
           HELPER / LOGIC FUNCTIONS
    //////////////////////////////////*/

// @notice gets all pool addresses for a network, 
// then orders them by block deployed in memory
/**
 * @notice gets all pool addresses for a network, 
 * then orders them by block deployed in memory
 * @param mem netowrk memory instance to read / write 
 * @returns sorted list of block timestamps for all fuse pools // TODO: debug potentially for arbitrum 
 */
async function getAllPools(mem: networkMemory) {
    console.log("HERE");
    let pools = await mem.directory.methods.getPublicPools().call();
    let poolsBlockList: number[] = []; 
    let poolBlockMap = new Map();; // key: blockDeployed, value: comptrollerAddress
    for(let i = 0; i < pools[1].length; i++) {
            poolBlockMap.set(pools[1][i].blockPosted, pools[1][i].comptroller); 
            poolsBlockList.push(pools[1][i].blockPosted);
    }
    mem.poolBlockMap = poolBlockMap;
    poolsBlockList.sort();
    return poolsBlockList;
}

/**
 * @param cAddr token address to get or initialize
 * @param mem   network memory instance to read / write 
 * @returns     cToken contract instance
 */
async function getCTokenInfo(cAddr: string, mem: networkMemory) {
    let cToken = mem.cTokenMap.get(cAddr);
    if(cToken == undefined) {
        cToken = new mem.web3.eth.Contract(mem.TOK_ABI, cAddr);
        mem.cTokenMap.set(cAddr, cToken);
    }
    return cToken;
}

/**
 * @notice helper function to get or set underlying address for cToken from memory / db
 * @param cAddr   cToken address
 * @param mem     network memory instance to read / write
 * @param cToken  cToken contract instance to query underlying address
 * @returns under underlying address
 */
async function getAndSetUnderlying(cAddr: string, mem: networkMemory, cToken: Contract) {
    let under = mem.underlyingMap.get(cAddr);
   
    // IMPL #1
    if(under == undefined) {
        under = await db.getUnderlyingOfCToken(mem.CHAIN, cAddr);
        if(under == undefined || under == "") { // TODO: test
            under = await cToken.methods.underlying().call();
            if(under == undefined) { throw new Error("error getting underlying from chain");}
            await db.addUnderlyingToCToken(mem.CHAIN, cAddr, under).catch(e => {throw new Error(e)});
            mem.underlyingMap.set(cAddr, under);
        } 

    // Adds cToken to underlying metadata if not already there
    let cTokens = await db.getCTokensOfUnderlying(chain, under);
    let i;
    for(i = 0; i < cTokens.length; i++) {
        if(cTokens[i] != cAddr) continue;
    } 
    if(i >= cTokens.length) {
        await db.addCTokenToUnderlying(chain, under, cAddr);
    } 

    return under;
}
}


async function getAndSetPool(pAddr: string, mem: networkMemory) {
    let pool = mem.poolContractMap.get(pAddr);
    if(pool == undefined) {
        pool = new mem.web3.eth.Contract(mem.POOL_ABI, pAddr);
        mem.poolContractMap.set(pAddr, pool);
    }
    return pool;
}


/**
 * @notice clears most recent underlying updates to prevent duplicate data
 * @param chain 
 * @param blockInterval 
 * @param mem 
 */
async function clearUnderlying(time: number, blockInterval: number, mem: networkMemory, exact: boolean) {
    let lastBlock = await db.getBlockLastUpdated(mem.CHAIN);
    let timestamp = (await mem.web3.eth.getBlock(lastBlock)).timestamp;

    for(let i = 0; i < mem.poolsBlockList.length; i++) {
            let pAddr = mem.poolBlockMap.get(mem.poolsBlockList[i]);
            if (pAddr == null) continue; // compiler safety, not possible
            await db.clearLastRow(mem.CHAIN, pAddr);
    }  
}


async function syncEth() {
    return;
    // probably going to use alchemy api here instead of etherscan
    // endpoint is same as plan iirc]
    // if schema exists then sync from that block every 30 min 

    // if
}
