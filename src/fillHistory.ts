import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { getUrl, getLensABI, getDirABI, getCtokenABI } from "./Chain";
import ethers from 'ethers';

const genBlock  = 12060711; // genesis block of fuse
// const allInfo = require("../assets/NtwrkAssets.json");

// await syncEth();
// await sync();


async function sync() {

    // set up lens contract to be called
    // let chain: keyof typeof allInfo = "ethMain"; //todo: multichain
    let url = getUrl("ethMain");
    console.log(url);

   // const web3 = new Web3(url);
    const web3 = new Web3(new Web3.providers.HttpProvider(url));

    
    let lensResult = getLensABI("ethMain");
    let dirResult = getDirABI("ethMain");

    let lens = new web3.eth.Contract(
        lensResult["abi"] as AbiItem[],
        lensResult["addr"]
    );

    let dir  = new web3.eth.Contract(
        dirResult["abi"] as AbiItem[],
        dirResult["addr"]
    );


    let tokenMap = new Map();
    let poolMap = new Map();

    //
    let poolBlockMap = new Map();

    let poolsBlockList = [];
    
    let blocknumber = await web3.eth.getBlockNumber();

    let options = undefined;

    let pools = await dir.methods.getPublicPools().call()
    .then(console.log); // TODO: figure out issue, might be using old ABI 

    // console.log(pools); 

    return;

    // Prevents thousands of empty calls
    for(let i = 0; i < pools[1].length; i++) {
        poolBlockMap.set(pools[1][3], pools[1][2]); // TODO: switch 3 to for if timespamp is better than block!!! 
        // i have no idea 
        poolsBlockList.push(pools[1][3]);
    }
    
    poolsBlockList.sort(); 

    console.log(poolsBlockList);

    let poolCount = 0;
    let previous = blocknumber;

    // TODO: break up loops
    for(let i = genBlock; i < blocknumber; i++) {

        let timestamp = (await web3.eth.getBlock(genBlock+i)).timestamp; 
        if(previous + 1800 > timestamp && previous != blocknumber) { continue; }
        previous += 1800; // TODO: check if 1800 = 30 mins lmfao 

        // adds next pool to query if its been deployed
        if(genBlock <= poolsBlockList[poolCount]) { poolCount++; }
        
        // Iterates through pools to get their cTokens and 
        for(let j = 0; j < poolCount; j++) {
            let pAddr = poolBlockMap.get(poolsBlockList[poolCount]);

            let cTokens = lens.methods.getPoolSummary(pAddr)[2]; // TODO: fix calls
            for(let k = 0; k < cTokens.length; k++) {
                let cAddr = cTokens[k];
                if(tokenMap.get(cAddr) == null) {
                    tokenMap.set(
                        cAddr, 
                        new web3.eth.Contract(getCtokenABI("ethMain"), cAddr)
                    );
                }
                let cToken = tokenMap.get(cAddr);
                let liquidity = await cToken.methods.totalSupply().call();
                let underlying = await cToken.underlying.call();// TODO: how to get underlying address?
                writeCToken(cAddr, underlying, timestamp, liquidity); // TODO: verify validity of call
            }
        }
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


