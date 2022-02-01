const allInfo = require("../assets/NtwrkAssets.json");
import { AbiItem } from 'web3-utils';
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

    let abi:  AbiItem[] = require(("../assets/" + chainInfo["lensAbi"]));
    let addr: string    = chainInfo["lensAddress"];
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

    let abi:  AbiItem[]  = require(("../assets/" + chainInfo["dirAbi"]));
    let addr: string     = chainInfo["dirAddress"];
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

export function getGenesis(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);
    return chainInfo["genesisBlock"];
}

export function getBlocks(chain: keyof typeof allInfo) {
    let chainInfo = getChainConsts(chain);
    return chainInfo["blocksIn30"];
}

/**
 * 
 * @param chain 
 * @returns 
 */
export function getUrl(chain: keyof typeof allInfo) {
    return getChainConsts(chain)["rpcUrl"];
}


