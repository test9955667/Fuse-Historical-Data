import path from "path/posix";
import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { 
    getUrl, 
    getLensInfo, 
    getDirInfo, 
    getComptrollerInfo, 
    getCTokenInfo 
} from "./Chain";

const genesis  = 12060711; // genesis block of fuse

const url  = getUrl("ethMain");
const web3 = new Web3(new Web3.providers.HttpProvider(url));

entry();
async function entry() {
    // 1) get the last time updated
    // 2) sync 
    // 3) maintain 
    await sync(genesis, false);
}

/**
 * @dev Syncs the  inline with the current block, 
 * then passes 
 */
async function sync(startBlock: number, exactTime: boolean) { //TODO; add chain spec here and reference it instead of literal

// ============ CONTRACT INSTANCES =========== // 
    console.log("test");
    let dResult = getDirInfo("ethMain");
    let dir     = new web3.eth.Contract(
        dResult["abi"] as AbiItem[],
        dResult["addr"]
    );

    let lResult = getLensInfo("ethMain");
    let lens    = new web3.eth.Contract(
        lResult["abi"] as AbiItem[],
        lResult["addr"]
    );

    let cmpABI  = getComptrollerInfo("ethMain"); 
    let ctkABI  = getCTokenInfo("ethMain");

// ===== ORDER POOLS BY BLOCK DEPLOYED ====== //
    let pools = await dir.methods.getPublicPools().call();

    let poolsBlockList: number[] = []; 
    let poolBlockMap = new Map(); // key: blockDeployed, value: comptrollerAddress
    for(let i = 0; i < pools[1].length; i++) {
        poolBlockMap.set(pools[1][i].blockPosted, pools[1][i].comptroller); // TODO: switch 3 to for if timespamp is better than block!!! 
        poolsBlockList.push(pools[1][i].blockPosted);
    }
    poolsBlockList.sort();



// ======== LOAD POOLS/TOKENS EFFICIENTLY ========= // 
    let poolContractMap = new Map(); // key: cTokenAddress, value cTokenInstance
    let cTokenMap = new Map();

    // let cTokenEvents = new Map(); // events branch


// =============  INITIAL TIME VALUES =========== //  
    let poolCount = 0;
    let previous  = Number((await web3.eth.getBlock(startBlock)).timestamp);
    let currBlock = startBlock;
    let endBlock  = await web3.eth.getBlockNumber();

// ============ GET HISTORIC LIQUIDITY ========== //
    while(currBlock < endBlock) {
        if(!exactTime) { currBlock += 140; } 
        else {
            let currTime = (await web3.eth.getBlock(currBlock)).timestamp;
            currBlock++;
            if(currTime < previous + 1800 ) { continue; } 
            previous += 1800; 
        } 
        while(currBlock >= poolsBlockList[poolCount]) { poolCount++; }

        lens.defaultBlock = currBlock;
        // Iterates through pools to get their cTokens 
        for(let j = 0; j < poolCount; j++) {
            let pAddr = poolBlockMap.get(poolsBlockList[j]);

            let pool = undefined;
            if(poolContractMap.get(pAddr) != null) {
                pool = poolContractMap.get(pAddr);
            } else {
                poolContractMap.set(pAddr, new web3.eth.Contract(cmpABI, pAddr));
                pool = poolContractMap.get(pAddr);
            }
            let poolString = {
                "Pool": pAddr,
                "Block": lens.defaultBlock,
                "cTokens": [{
                    "Token": "",
                    "Supply": ""
                } ]
            }
            
            let cTokens = await pool.methods.getAllMarkets().call(); // TODO: should i deploy a contract? 
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];

                let token = undefined;
                if(cTokenMap.get(cAddr) != null) {
                    token = cTokenMap.get(cAddr);
                } else {
                    cTokenMap.set(
                        cTokens[k], 
                        new web3.eth.Contract(ctkABI,cAddr)
                    );
                    token = cTokenMap.get(cAddr);
                    // let events = await token.getPastEvents(); events branch
                    // cTokenEvents.set(cAddr, events);
                }

                token.defautBlock = currBlock;
                let supply = await token.methods.totalSupply().call();
                poolString.cTokens.push({Token: cAddr, Supply: supply});

                //writeCToken(cAddr, )
                
            }
            console.log(poolString);
            // The lens takes the comptroller object (pool), list of ctokens(cTokens)

        }
        endBlock = await web3.eth.getBlockNumber();
    }
}



/**
 * 
 * @param addr address of cToken
 * @param under address of underlying
 * @param timestamp timestamp of query 
 * @param liquidity liquidity *after* decimals to 1e18 
 */
function writeCToken(addr: string, under: string, timestamp: string | number, liquidity: BigInt) {
    // TODO: set up schema
    
    // if hypertable exists for addr, then add entry,
    // else create hypertable and add entry
    // add liquidity 
}

function writeUnderlying(addr: string, timestamp: BigInt) {
    // TODO: set up schema

    // if hypertable exists for addr, write entry
}

async function syncEth() {
    return;
    // probably going to use alchemy api here instead of etherscan
    // endpoint is same as plan iirc]
    // if schema exists then sync from that block every 30 min 

    // if
}



