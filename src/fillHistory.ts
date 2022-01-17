import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { getUrl, getLensInfo, getDirInfo, getCtokenABI } from "./Chain";

const genesis  = 12060711; // genesis block of fuse

const url  = getUrl("ethMain");
const web3 = new Web3(new Web3.providers.HttpProvider(url));


async function entry() {
    // 1) get the last time updated
    // 2) sync 
    // 3) maintain 
}

/**
 * @dev Syncs the  inline with the current block, 
 * then passes 
 */
async function sync(startBlock: number) {

// ============ CONTRACT INSTANCES =========== // 

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

// ===== ORDER POOLS BY BLOCK DEPLOYED ====== //
    let pools = await dir.methods.getPublicPools().call()
    .then(console.log); // TODO: figure out issue, might be using old ABI 

    let poolsBlockList = []; 
    let poolBlockMap = new Map(); // key: blockDeployed, value: comptrollerAddress
    for(let i = 0; i < pools[1].length; i++) {
        poolBlockMap.set(pools[1][3], pools[1][2]); // TODO: switch 3 to for if timespamp is better than block!!! 
        // i have no idea 
        poolsBlockList.push(pools[1][3]);
    }
    poolsBlockList.sort(); // TODO: test 
    console.log(poolsBlockList);


// ============= ????? ============== // 
    let tokenMap = new Map(); // key: cTokenAddress, value cTokenInstance

// =============  INITIAL TIME VALUES =========== //  
    let poolCount = 0;
    let previous  = Number((await web3.eth.getBlock(startBlock)).timestamp);
    let currBlock = startBlock;
    let endBlock  = await web3.eth.getBlockNumber();

// ============ GET HISTORIC LIQUIDITY ========== //
    for(currBlock; currBlock < endBlock; currBlock++) {

        let currTime = (await web3.eth.getBlock(currBlock)).timestamp;

        if(currTime < previous + 1800 ) { continue; }
        previous += 1800;

        // adds next pool to query if its been deployed
        while(currBlock >= poolsBlockList[poolCount]) { poolCount++; }
        
        // Iterates through pools to get their cTokens and 
        for(let j = 0; j < poolCount; j++) {
            let pAddr = poolBlockMap.get(poolsBlockList[poolCount]);
            let cTokens = lens.methods.getPoolSummary(pAddr)[2]; // TODO: call for block
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];
                let cToken = undefined;

                if(tokenMap.get(cAddr) != null) {
                    cToken = tokenMap.get(cAddr); 
                } else {
                    cToken = new web3.eth.Contract(getCtokenABI("ethMain"), cAddr);
                    tokenMap.set(cAddr, cToken); 
                }
                let underlying = await cToken.underlying.call();// TODO: how to get underlying address?
                // TODO: check if its ether
                let liquidity = await cToken.methods.totalSupply().call(); 
                

                writeCToken(cAddr, underlying, currTime, liquidity); // TODO: verify validity of call
            }
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



