import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { Contract } from "web3-eth-contract";
import { networkMemory } from "./networkMemory";
import * as ntwk from "./ChainParse";

import { CHAINID, networks } from "../assets/Networks"

import * as db from './Index';


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
    let cTokenMap = mem.cTokenMap;
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

        // Iterates through pools to get their cTokens 
        let tokensToPush: tokenEntry[] = [];
        for(let j = 0; j < poolCount; j++) {
            /*////////////////////////////////////////////////////
            Get pool instance and set it in memory if not already 
            //////////////////////////////////////////////////*/
            let pAddr = mem.poolBlockMap.get(poolsBlockList[j]);
            if(pAddr == undefined) { continue; }

            let pool = undefined;
            if(poolContractMap.get(pAddr) != null) {
                pool = poolContractMap.get(pAddr);
            } else {
                // instansiates new pool and adds it to memory
                poolContractMap.set(pAddr, new mem.web3.eth.Contract(mem.POOL_ABI, pAddr));
                pool = poolContractMap.get(pAddr);
                mem.poolContractMap = poolContractMap; 
            } if(pool == undefined) { continue; }


            /*///////////////////////////////////////////////////
            Iterates through cTokens to write data for currBlock
            /////////////////////////////////////////////////*/

            let cTokens = await pool.methods.getAllMarkets().call(); // TODO: should i deploy a contract? 
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];

                let token = undefined;
                if(cTokenMap.get(cAddr) != null) {
                    token = cTokenMap.get(cAddr);
                } else {
                    // instantiates new cToken and adds it to memory
                    cTokenMap.set(
                        cTokens[k], 
                        new mem.web3.eth.Contract(mem.TOK_ABI,cAddr)
                    );
                    token = cTokenMap.get(cAddr);
                    
                    // 1 get underlying 
                    let underling = await token?.methods.underlying().call();
                    // 2 add it and underlying to memory
                    underlyingMap.set(cAddr, underling);
                    // 3 add it ctoken of underling database 
                    // await db.addCTokenToUnderlying(underling, cAddr);
                    // 4 add it and underlying to database 
                    // await db.addUnderlyingToCToken(cAddr, underling);

                    mem.cTokenMap = cTokenMap;
                    // let events = await token.getPastEvents(); events branch
                    // cTokenEvents.set(cAddr, events);
                } if(token == undefined) { continue; }

                token.defaultBlock = currBlock;
                let supply = undefined;
                let borrow = undefined;
                let liquid = undefined;
                try {
                supply = await token.methods.totalSupply().call();
                borrow = await token.methods.totalBorrows().call();
                liquid = await token.methods.getCash().call();
                } catch(e) {
                    throw new Error(`${cAddr} failed to load`);
                }

                tokensToPush.push({"network": chain, "name": cAddr, "supply": supply, "borrow": borrow , "liquidity": liquid});
                // gets underlying address for cToken and saves it to memory if not already there
                try{
                let underlying = getOrSetUnderlying(chain, cAddr);
                } catch(e) {
                    console.log(e);
                    continue;
                }
                

            }
            for(let i = 0; i < tokensToPush.length; i++) {
                let tok = tokensToPush[i];
                db.addCTokenData(chain, tok.name, timestamp, tok.supply, tok.borrow, tok.liquidity, true); // todo fix this shit bruh
                db.addCTokenData(chain, tok.name, timestamp, tok.supply, tok.borrow, tok.liquidity, false);
            }
            tokensToPush = [];
        }
        await db.setBlockLastUpdated(chain, BigInt(currBlock));
        endBlock = await mem.web3.eth.getBlockNumber();
    }
    
}

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

async function getPoolTokenInfo(block: number) {
    // take token logic out of sync and place it here    
    
}

async function getCurrentBlock(network: string, web3: any,) {
    // 1) get pools from chain
    // 2) get ctokens for each pool 
    // for each ctoken,
    // 1) do underling check

}



// Helper function to get the underlying for a cToken, 
// if not in memory or storage it get it from chain 
// and enters it into the metadata of the db 
async function getOrSetUnderlying(chain: number, cAddr: string) {
    let mem = networkMap.get(chain);

    // IMPL #1
    if(mem?.underlyingMap.get(cAddr) != null) {
        return mem.underlyingMap.get(cAddr);
    } else {
        let under = await db.getUnderlyingOfCToken(chain, cAddr);
        if(under == "") { // TODO: test
            let contract = mem?.cTokenMap.get(cAddr);
            if(contract == undefined) { 
                throw new Error("cToken contract not found"); 
            }
            under = await contract.methods.underlying().call();
            await db.addUnderlyingToCToken(chain, cAddr, under);
            await db.addCTokenToUnderlying(chain, under, cAddr);
            mem?.underlyingMap.set(cAddr, under);
        }
        return under;
    }

    // IMPL #2
    /* 
    let underlying = mem?.underlyingMap.get(cAddr) != null ? mem.underlyingMap.get(cAddr) : await getUnderlyingOfCToken(chain, cAddr)
    .then(res => {mem?.underlyingMap.set(cAddr, res); return res;})
    .catch(err => {throw new Error(`failed to get underlying of ${cAddr}`);});
    if(underlying == "") {

    }
    */
 
}

// clears most recent underlying updates to prevent duplicate data
// gets last updated then adds mem.block (interval) to it 
async function clearUnderlying(chain: number, blockInterval: number, mem: networkMemory) {
    let block = await db.getBlockLastUpdated(chain) + blockInterval;
    let timestamp = (await mem.web3.eth.getBlock(block)).timestamp;
    let i;
    for(i = 0; i < mem.poolsBlockList.length; i++) {
        while(mem.poolsBlockList[i] >= block) {
            let pAddr = mem.poolBlockMap.get(mem.poolsBlockList[i]);
            if (pAddr == null) continue; // compiler safety, not possible
            await db.clearTokenAtRow(chain, pAddr, timestamp);
            // TODO: finish implementation 
            i++;
        }
        
    }


    
}



async function syncEth() {
    return;
    // probably going to use alchemy api here instead of etherscan
    // endpoint is same as plan iirc]
    // if schema exists then sync from that block every 30 min 

    // if
}






