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
export function getLensABI(chain: keyof typeof allInfo)  {
    var chainInfo = getChainConsts(chain);

    var abi:  JSON    = require("../assets/" + chainInfo["lensAbi"]);
    var addr: string  = chainInfo["lensAddress"];

    return { abi , addr };
}


/**
 * 
 * @param chain 
 * @param web3 
 * @param addr 
 * @returns 
 */
export function getCtokenABI(chain: keyof typeof allInfo) {
    var chainInfo = getChainConsts(chain);

    var abi  = require("../assets/" + chainInfo["cTokenAbi"]);
    
    return abi;
}


/**
 * 
 * @param chain 
 * @returns 
 */
export function getUrl(chain: keyof typeof allInfo) {
    return getChainConsts(chain)["rpcUrl"];
}

