import { getLens, getUrl } from './Chain';
const ethers = require('ethers');
const Web3 = require('web3');
const genBlock  = 12060711; // genesis block of fuse

function sync() {
    
    var chain = "ethMain"; //todo: multichain
    var web3 = new Web3(getUrl(chain));
    var lens = getLens(chain, web3);

    var tokenMap = new Map();
    var poolsMap = new Map();

    var poolsList = [];

    var pools = lens.getPublicPoolsWithData(); // todo: test 
    
    // Sets mappings for efficient calls
    for(var i = 0; i < pools[1].length; i++) {
        poolsList.push(pools[1][2]);
        poolsMap.set(pools[1][3], pools[1][2]); // todo: switch 3 to for if timespamp is better than block!!! i have no idea 
    }
    

    var blocknum = web3.eth.getBlockNumber(); // i have no fucking clue if this works
    // typescript is fucking retarded actually 


    
    for(var i = genBlock; i < blocknum; i++) {

    }




}




function fillHistory()  {    

    let lens = getLens("ethMain", new Web3("ff"));


}

function getPool(network: string) {
    var timestamps    = [];
    var poolCreations = new Map();

    let lens = getLens(network);
    // 1) iterate from fuse genesis TODO: get fuse genesis 
    // 2) if pool is deployed, for each token if event emitted then go to underlying address and get amount in / out for token for that f/ctoken
    // add / subtract to total for that underlying and add / subtract for that individual fToken in their respective hypertabels
    // TODO: determine if they should be seperate for each fToken or combined in DB

    const pools = ethers.callStatic.lens.getPublicPoolsWithData();
}


function getData(startTime: int, endTime: int) {
    // 3) im gay
}

// 1) since fuse genesis






