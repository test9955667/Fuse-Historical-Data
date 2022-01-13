import { getLensABI, getUrl } from './Chain';
const ethers = require('ethers');
import Web3 = require('web3');
const genBlock  = 12060711; // genesis block of fuse
// const allInfo = require("../assets/NtwrkAssets.json");

sync();

function sync() {
    
    // set up lens contract to be called
    // var chain: keyof typeof allInfo = "ethMain"; //todo: multichain
    var web3 = new Web3.default(new Web3.default.providers.HttpProvider(getUrl("ethMain")));
    
    var lensResult = getLensABI("ethMain");

    var lens = new web3.eth.Contract(lensResult["abi"], lensResult["addr"]);

    var tokenMap = new Map();
    var poolsMap = new Map();

    var poolsList = [];

    var pools = lens.getPublicPoolsWithData(); // todo: test 

    console.log(pools[1][3]);

    return; 

    // Sets mappings for efficient calls
    for(var i = 0; i < pools[1].length; i++) {
        poolsMap.set(pools[1][3], pools[1][2]); // TODO: switch 3 to for if timespamp is better than block!!! 
        // i have no idea 
        poolsList.push(pools[1][3]);
    }
    

    var blocknum = async (details: any) => {return web3.eth.getBlockNumber();
     } // i have no fucking clue if this works
    // typescript is fucking retarded actually 


    var poolCount = 0;
    for(var i = genBlock; i < blocknum; i++) {

        let timestamp = web3.eth.getBlock(genBlock+i);
        if()
        
        var currBlock = 0; // TODO: get timestamp of next block + 30 mins 

        // adds next pool to query if its been deployed
        if(genBlock <= poolsList[poolCount]) { poolCount++; }
        
        // 
        for(var j = 0; j < poolCount; j++) {
            // do calls here
        }

    }




}



function getPool(network: string) {
    var timestamps    = [];
    var poolCreations = new Map();

    // let lens = getLens(network);

    // 1) iterate from fuse genesis TODO: get fuse genesis 
    // 2) if pool is deployed, for each token if event emitted then go to underlying address and get amount in / out for token for that f/ctoken
    // add / subtract to total for that underlying and add / subtract for that individual fToken in their respective hypertabels
    // TODO: determine if they should be seperate for each fToken or combined in DB

    const pools = ethers.callStatic.lens.getPublicPoolsWithData();
}


function getData(startTime: number, endTime: number) {
    // 3) im gay
}

// 1) since fuse genesis



function main() {
    // 1) check schema somehow 
    // 2) ??? profit
}





