import * as env from '../assets/Networks'
import * as db from '../dbOperations/Queries';
import Web3 from 'web3';
import {Contract} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

type contractInfo = { abi: AbiItem[], addr: string }

type memory = {
    web3:          Web3,
    chain:         number,
    blocks:        number,
    tokAbi:        AbiItem[],
    cmpAbi:        AbiItem[],
    genesis:       number,
    dirInfo:       contractInfo,
    lensInfo:      contractInfo,
    lastUpdated:   number,
    underlyingMap: Map<string, string>,
    cTokensOfPool: Map<string, string[]>
}

type  network  = env.network;
export const MAINNETS = env.MAINNETS;
export const CHAINS   = env.CHAINID;
export const NETWORKS = env.networks;
export const dirAbi:  AbiItem[] = require('../assets/abis/DIRV1.json');
export const cmpAbi:  AbiItem[] = require('../assets/abis/COMPV1.json');
export const tokAbi:  AbiItem[] = require('../assets/abis/TOKV1.json');

export const getEnv = async (chain: number) => { 
    let ntwk: network =  NETWORKS[CHAINS[MAINNETS[chain]]];
    const web3 = new Web3(new Web3.providers.HttpProvider(ntwk.rpc));

    let network: memory = {
        web3:          web3,
        chain:         chain,
        blocks:        ntwk.genesisBlock,
        tokAbi:        tokAbi,
        cmpAbi:        cmpAbi,
        genesis:       ntwk.genesisBlock,
        dirInfo:       {abi: dirAbi, addr: ntwk.dirAddr},
        lensInfo:      {abi: dirAbi, addr: ntwk.lensAddr},
        lastUpdated:   await db.getBlockLastUpdated(chain),
        underlyingMap: new Map(),
        cTokensOfPool: new Map()
    }

    return network;
}