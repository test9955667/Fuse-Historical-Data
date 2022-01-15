const allInfo = require("../assets/NtwrkAssets.json");
import ethers from 'ethers';

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
    let chainInfo = getChainConsts(chain);

    let abi = require(("../assets/" + chainInfo["lensAbi"]));
    let addr = chainInfo["lensAddress"];
    return { abi , addr };
}

export function getLensABIEthers(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);

    let eth = new ethers.providers.AlchemyProvider(chainInfo["rpcUrl"]);

    let abi = require(("../assets/" + chainInfo["lensAbi"]));
    let addr = chainInfo["lensAddress"];

    let lens = new ethers.Contract(addr, abi, eth);
    return lens;
}

/**
 * 
 * @param chain String to search multichain JSON for
 * @param web3 Web3 object to instansiate contract with
 * @returns 
 */
 export function getDirABI(chain: keyof typeof allInfo)  {
    let chainInfo = getChainConsts(chain);

    let abi = require(("../assets/" + chainInfo["dirAbi"]));
    let addr = chainInfo["dirAddress"];
    return { abi , addr };
}
/**
 * 
 * @param chain 
 * @returns 
 */
export function getDirEthers(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);

    let eth = new ethers.providers.AlchemyProvider(chainInfo["rpcUrl"]);

    let abi = require(("../assets/" + chainInfo["dirAbi"]));
    let addr = chainInfo["dirAddress"];

    let dir = new ethers.Contract(addr, abi, eth);
    return dir;

}


/**
 * 
 * @param chain  
 * @returns abi JSON object of abi 
 */
export function getCtokenABI(chain: keyof typeof allInfo) {
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
