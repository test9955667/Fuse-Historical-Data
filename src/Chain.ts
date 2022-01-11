const allInfo = require("../assets/NtwrkAssets.json");
const ethers  = require('ethers');
const Web3    = require('web3');



/**
 * 
 * @param chain 
 * @returns 
 */
function getChainConsts(chain: keyof typeof allInfo) {
    let chainInfo = undefined;
    try {
        chainInfo = allInfo[chain];
        if(chainInfo == undefined) { throw new Error(); }
        return chainInfo;
    } catch (e) {  return "err, invalid input"; }
}


/**
 * 
 * @param chain String to search multichain JSON for
 * @param web3 Web3 object to instansiate contract with
 * @returns 
 */
export function getLens(chain: keyof typeof allInfo, web3: typeof Web3)  {
    var chainInfo = getChainConsts(chain);

    var path  = chainInfo["lensAbi"];
    var abi   = require(path);
    var addr  = chainInfo["lensAddress"];

    return new web3.eth.Contract(abi, addr);
}


/**
 * 
 * @param chain 
 * @param web3 
 * @param addr 
 * @returns 
 */
export function getCtoken(chain: keyof typeof allInfo, web3: typeof Web3, addr: string) {
    var chainInfo = getChainConsts(chain);

    var path = chainInfo["cTokenAbi"];
    var abi  = require(path);
    
    return new web3.eth.Contract(abi, addr);
}


/**
 * 
 * @param chain 
 * @returns 
 */
export function getUrl(chain: keyof typeof allInfo) {
    return getChainConsts(chain)["rpcUrl"];
}



