const allInfo = require("../assets/NtwrkAssets.json");

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
export function getLensInfo(chain: keyof typeof allInfo)  {
    let chainInfo = getChainConsts(chain);

    let abi  = require(("../assets/" + chainInfo["lensAbi"]));
    let addr = chainInfo["lensAddress"];
    return { abi , addr };
}


/**
 * 
 * @param chain String to search multichain JSON for
 * @param web3 Web3 object to instansiate contract with
 * @returns 
 */
 export function getDirInfo(chain: keyof typeof allInfo)  {
    let chainInfo = getChainConsts(chain);

    let abi  = require(("../assets/" + chainInfo["dirAbi"]));
    let addr = chainInfo["dirAddress"];
    return { abi , addr };
 }

export function getComptrollerInfo(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);
    let abi: any = require("../assets/" + chainInfo["comptrollerAbi"]);
    return abi;
}

export function getCTokenInfo(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);
    let abi: any = require("../assets/" + chainInfo["cTokenAbi"]);
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
