import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { Contract } from "web3-eth-contract";
import * as ntwk from "./ChainParse";

import { CHAINID, networks } from "../assets/Networks"

import * as db from './Index';
import { pool } from "./dbOperations/db";


// ===========  TYPES  =========== // 
type network = { network: keyof typeof CHAINID }

type contractInfo = { abi: AbiItem[], addr: string }

type memory = {
    web3:          Web3,
    chain:         number,
    blocks:        number,
    tokAbi:        AbiItem[],
    cmpAbi:        AbiItem[],
    genesis:       number,
    dirInfo:       contractInfo,
    lensInfo:      contractInfo,
    lastUpdated:   number,
    underlyingMap: Map<string, string>,
    cTokensOfPool: Map<string, string[]>
}

// ===== GLOBAL MEMORY ===== //
let networkNames: number[] = [];
let networkMap: Map<number, memory> = new Map();

// ==== CONTRACT INSTANCE  ==== //
const contract = (addr: string, abi: AbiItem[], web3: Web3) => {
    return new web3.eth.Contract(abi, addr);
}

entry([{network: "ETHEREUM"}], false);

async function entry(networks: network[], exactTime: boolean) {

    for(let i = 0; i < networks.length; i++) {
        // Create network memory instance
        let chain = CHAINID[networks[i].network];
        let network: memory = {
        web3          : new Web3(new Web3.providers.HttpProvider(ntwk.getUrl(chain))),    
        chain         : chain,
        blocks        : ntwk.getBlocks(chain),
        tokAbi        : ntwk.getCTokenABI(chain),
        cmpAbi        : ntwk.getComptrollerABI(chain),
        genesis       : ntwk.getGenesis(chain),
        dirInfo       : ntwk.getDirInfo(chain),
        lensInfo      : ntwk.getLensInfo(chain),
        lastUpdated   : await db.getBlockLastUpdated(chain),
        underlyingMap : new Map(), 
        cTokensOfPool : new Map()
        }

        // Set network instance in memory 
        networkMap.set(chain, network);
        networkNames.push(chain);

        await sync(chain, exactTime);
    }

}

/**
 * @dev Syncs the  inline with the current block, 
 * then passes 
 */
async function sync(chain: number, exactTime: boolean) {
    // loads network memory instance 
    let mem  = networkMap.get(chain);
    if(mem == undefined) {return}

    let { poolBlockList, poolBlockMap} = await getAllPools(mem);
    await clearUnderlying(mem, exactTime, poolBlockList, poolBlockMap);
    if(poolBlockList[0] == undefined) {return;}
// =============  INITIAL TIME VALUES =========== //  
    let poolCount = 0;
    let previous  = Number((await mem.web3.eth.getBlock(mem.lastUpdated)).timestamp);
    
    // @notice prepares query time intervals in blocks
    // Exhibit A why javascript is so bad
    let currBlock = mem.lastUpdated;
    let increment = mem.blocks;
    let endBlock  = await mem.web3.eth.getBlockNumber();

 
// ============ GET HISTORIC LIQUIDITY ========== //
    while(currBlock < endBlock) {
        // 30 min interval logic
        if(!exactTime) { 
            currBlock = Number(currBlock) + Number(increment); 
        } else {
            let currTime = (await mem.web3.eth.getBlock(currBlock)).timestamp;
            currBlock++;
            if(currTime < previous + 1800 ) { continue; } 
            previous += 1800; 
        } 

        while(currBlock > poolBlockList[poolCount]) { poolCount++; }
        mem.lastUpdated = currBlock;

        let blockInfo = await mem.web3.eth.getBlock(currBlock);
        let timestamp = blockInfo.timestamp;

        
        
       
        for(let j = 0; j < poolCount; j++) {
            // gets and or sets pool instance 
            let pAddr = poolBlockMap.get(poolBlockList[j]);
            if(pAddr == undefined) { continue; } 
            let pool = contract(pAddr, mem.cmpAbi, mem.web3);

            // gets and or sets list of cTokens for pool
            let cTokens = mem.cTokensOfPool.get(pAddr);
            if(cTokens == undefined) { 
                cTokens = await pool.methods.getAllMarkets().call();
                if(cTokens == undefined) { continue; }
                mem.cTokensOfPool.set(pAddr, cTokens);
            }
             
        
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];

                // gets and or sets ctoken instance and underlying address
                let token = contract(cAddr, mem.tokAbi, mem.web3);
                let under = await getAndSetUnderlying(chain, cAddr, mem, token);
                if(under == undefined) { continue; }
                
                // get block-specific data for cToken 
                token.defaultBlock = currBlock;
                try {
                let supply = await token.methods.totalSupply().call();
                let borrow = await token.methods.totalBorrows().call();
                let liquid = await token.methods.getCash().call();

                // write data to cToken
                cAddr = cAddr.toLowerCase();
                db.addCTokenData(chain, cAddr, timestamp, supply, borrow, liquid, true);
                // write data to underyling 
                db.addCTokenData(chain, under, timestamp, supply, borrow, liquid, false);

                if(5*5 == 25) {return;}

                } catch(e) {
                    throw new Error(`${cAddr} failed to load`);
                }
            }
        }
        // await db.setBlockLastUpdated(chain, BigInt(currBlock)); // TODO: uncomment when done testing
        // endBlock always current block until sync is caught up, then sync ends
        endBlock = await mem.web3.eth.getBlockNumber();
    }
}

// 

    /*//////////////////////////////////
           HELPER / LOGIC FUNCTIONS
    //////////////////////////////////*/

/** -- DONE
 * @notice gets all pool addresses for a network, 
 * then orders them by block deployed in memory
 * @param mem netowrk memory instance to read / write 
 * @returns sorted list of block timestamps for all fuse pools // TODO: debug potentially for arbitrum 
 */
async function getAllPools(mem: memory) {

    let pools = await contract(
        mem.dirInfo.addr, 
        mem.dirInfo.abi, 
        mem.web3
        ).methods.getAllPools().call();

    let poolBlockList: number[] = []; 
    let poolBlockMap:  Map<number, string> = new Map();; // key: blockDeployed, value: comptrollerAddress

    for(let i = 0; i < pools.length; i++) {
            poolBlockMap.set(pools[i].blockPosted, pools[i].comptroller); 
            poolBlockList.push(pools[i].blockPosted);
    }

    poolBlockList.sort();
    return { poolBlockList, poolBlockMap };
}



/**
 * @notice helper function to get or set underlying address for cToken from memory / db, 
 * is used to ensure entries in db after sync. 
 * @param cAddr   cToken address
 * @param mem     network memory instance to read / write
 * @param cToken  cToken contract instance to query underlying address
 * @returns under underlying address
 */
async function getAndSetUnderlying(chain: number, cAddr: string, mem: memory, cToken: Contract) {
    // Checks memory first, then db, then chain for underlying address
    let under = mem.underlyingMap.get(cAddr); 
    if(under == undefined) {
        under = (await db.getUnderlyingOfCToken(mem.chain, cAddr)).rows[0]; 
        if(under == undefined) {
            under = await cToken.methods.underlying().call(); 
            if(under != undefined) { 
                // add missing underlying to db and memory 
                await db.addUnderlyingToCToken(mem.chain, cAddr, under)
                .catch(e => {throw new Error(e)}); // TODO: test catch
                mem.underlyingMap.set(cAddr, under);
                // adds cToken to underlying metadata in db
                await addCTokenToUnderlying(chain, under, cAddr);
            } else throw new Error(`error fetching underling from ${cAddr}`);
        } 
    } return under;
}



async function clearUnderlying(mem: memory, exact: boolean, poolsBlockList: number[], poolBlockMap: Map<number, string>) {
    // TODO: get last updated block, then clear any entries later than it!!!
    let lastBlock = await db.getBlockLastUpdated(mem.chain);
    let timestamp = (await mem.web3.eth.getBlock(lastBlock)).timestamp;

    for(let i = 0; i < poolsBlockList.length; i++) {
        let pAddr = poolBlockMap.get(poolsBlockList[i]);
        if (pAddr == null) continue; // compiler safety, not possible
        await db.clearRow(mem.chain, pAddr, timestamp); // TODO: test catch
    }  
}


async function addCTokenToUnderlying(chain: number, under: string, cAddr: string) {
    // Adds cToken to underlying metadata if not already there
    let cTokens = (await db.getCTokensOfUnderlying(chain, under)).rows;
    let i;
    for(i = 0; i < cTokens.length; i++) {
        if(cTokens[i] != cAddr) continue;
    } 
    if(i >= cTokens.length) {
        await db.addCTokenToUnderlying(chain, under, cAddr);
    } 

}




async function syncEth() {
    return;
    // probably going to use alchemy api here instead of etherscan
    // endpoint is same as plan iirc]
    // if schema exists then sync from that block every 30 min 

    // if
}
