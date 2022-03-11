import * as env from '../assets/Networks'
import * as db from '../dbOperations/Queries';
import Web3 from 'web3';
import {Contract} from 'web3-eth-contract';

import {AbiItem} from 'web3-utils';
import {setAllPools, getEvents} from './SetupData';
import { raw } from 'express';


type  network  = env.network;
const MAINNETS = env.MAINNETS;
const CHAINS   = env.CHAINID;
const NETWORKS = env.networks;
const dirAbi:  AbiItem[] = require('../assets/abis/DIRV1.json');
const cmpAbi:  AbiItem[] = require('../assets/abis/COMPV1.json');
const tokAbi:  AbiItem[] = require('../assets/abis/TOKV1.json');


async function updateClock() {
    let i = 0; 
    let ntwk: network =  NETWORKS[CHAINS[MAINNETS[i]]];
    const web3 = new Web3(new Web3.providers.HttpProvider(ntwk.rpc));

    await setAllPools(web3, ntwk);

    await updateAllCTokens(web3, ntwk.id);
}


type eventData = {
    totalSupply: bigint,
    totalBorrow: bigint,
    blockNumber: number,
    timestamp:   number
}

async function updateAllCTokens(web3: Web3, chainid: number) {
    let cToks = await db.getCTokenMetadata(chainid, undefined);

    for(let i = 0; i < cToks.length; i++) {
        let cToken = new web3.eth.Contract(tokAbi, cToks[i].address);
        let start = 1+Number(cToks[i].lastUpdated);

        let cleanEvents: eventData[] = [];

        let rawEvents = await cToken.getPastEvents('allEvents', {fromBlock: start});
        if(rawEvents.length == 0) continue;

        let end = await web3.eth.getBlockNumber();
        cleanEvents = await getEvents(start, end, cleanEvents, web3, cToken);

        // adds historic data for cToken to db, blank buffer is first index
        for(let j = 1; j < cleanEvents.length; j++) {
            let event = cleanEvents[j];
            await db.addTokenData(
                chainid, 
                event.timestamp, 
                event.blockNumber, 
                cToks[i].address, 
                cToks[i].underlying,
                event.totalSupply,
                event.totalBorrow
            );
        }
    }
}