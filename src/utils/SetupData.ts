import * as env from '../assets/Networks'
import * as db from '../dbOperations/Queries';
import Web3 from 'web3';
import {Contract} from 'web3-eth-contract';
import {AbiItem} from 'web3-utils';

import { isNumberObject } from 'util/types';



type  network  = env.network;
const MAINNETS = env.MAINNETS;
const CHAINS   = env.CHAINID;
const NETWORKS = env.networks;
const dirAbi:  AbiItem[] = require('../assets/abis/DIRV1.json');
const cmpAbi:  AbiItem[] = require('../assets/abis/COMPV1.json');
const tokAbi:  AbiItem[] = require('../assets/abis/TOKV1.json');


type allPoolInfo = {
    poolBlockList: blockAddr[],
    cTokens:       string[]
}

// Gets the relevant metadata of the database to use in memory, 
// If there is missing data, then it is first populated into the db 
export default async function() {
    let i = 0; 
    let ntwk: network =  NETWORKS[CHAINS[MAINNETS[i]]];
    const web3 = new Web3(new Web3.providers.HttpProvider(ntwk.rpc));

    const testAddr = "0x97fE54066FbB0550fE133aaC0970618485133552";



    let pools = await setAllPools(web3, ntwk);



    await getEventsByBlock(web3, ntwk);

    // await getEvents(web3, ntwk); // TODO: implement later
    // get and or set all pools in database
}

type blockAddr = {
    block: number
    addr:  string
}

type poolResult = {
    chain:     number
    pool:      string
    block:     number
    timestamp: number
    ctokens:   string[]
}

type dirResult = {
    name:            string,
    creator:         string,
    comptroller:     string,
    blockPosted:     number,
    timestampPosted: number,
}




// Sets all pools that arent already in the database
// @return blockPool[] object for historic search to use for chain-queries
async function setAllPools(web3: Web3, ntwk: network) {
    console.log("setting all current pools with data");
    const dir: Contract = new web3.eth.Contract(dirAbi, ntwk.dirAddr);
    // 
    let poolBlockList: blockAddr[] = [];

    // list pools and ctokens of pool data in db
    let data: poolResult[] = (await db.getPoolMetadata(ntwk.id, undefined));
    let dbPools = data.map(d => d.pool);

    // list fuse pools stored in directory
    let pList: dirResult[] = await dir.methods.getAllPools().call();

    
    pList.forEach(async (p) => {
        poolBlockList.push({ block: p.blockPosted, addr: p.comptroller });
    });

    // gets all pools in the directory, but not yet in db
    pList = pList.filter((a) => !dbPools.includes(a.comptroller));
    console.log("Getting and setting metadata of all pools");
    
    for(let j = 0; j < pList.length; j++) {
        const pRes = pList[j];
        // gets metadata of pool
        const pool:  Contract = new web3.eth.Contract(cmpAbi, pRes.comptroller);
        let stamp = (await web3.eth.getBlock(pRes.blockPosted)).timestamp;
        stamp = typeof(stamp) == 'number' ? stamp : Number(stamp);
        poolBlockList.push({block: pRes.blockPosted, addr: pRes.comptroller});

        const cToks: string[] = await pool.methods.getAllMarkets().call();
        let res = await db.addPool(ntwk.id, pRes.comptroller, pRes.blockPosted, stamp, cToks);

        for(let i = 0; i < cToks.length; i ++) {
            let cTok = new web3.eth.Contract(tokAbi, cToks[i]);
            
            let underlying = await cTok.methods.underlying().call();
            let symbol = await cTok.methods.symbol().call();
            let name = await cTok.methods.name().call();
            
            await db.setCTokenMetadata(ntwk.id, cToks[i], underlying, pRes.comptroller, name, symbol);
            await db.addCTokenToUnderlying(ntwk.id, underlying, cToks[i]);

        }
    }

    poolBlockList.sort((a, b) => a.block - b.block);
    console.log("Metadata initialized!");
    return poolBlockList;

}

type blockEvents = {
    block:  number,
    events: string[]
}

// get all events in a 2k block range 
async function getEventsByBlock(web3: Web3, ntwk: network) {
    console.log("getting every block");
    let eventsByBlock: blockEvents[] = [];
    let comps: poolResult[] = await db.getPoolMetadata(ntwk.id, undefined);
    
    let latest = await web3.eth.getBlockNumber();
    let index = 0;
    let totalCount = 0;
    for(let i = 0; i < comps.length; i++) {

        let cToks = comps[i].ctokens;
        if(cToks.length == 0) continue;

        for(let j = 0; j < cToks.length; j++) {
            let start = comps[i].block-100000;
            let filteredEvents: number[] = [];
            let token = new web3.eth.Contract(tokAbi, cToks[j]);
            let under = (await db.getCTokenMetadata(ntwk.id, cToks[j])).rows[0].underlying;

            let events = await getAllTokenEvents(ntwk.id, cToks[j], start, latest, 400000, token, web3, under);

            totalCount++;
        }

    }
    console.log(totalCount);
}


type eventData = {
    totalSupply: bigint,
    totalBorrow: bigint,
    blockNumber: number,
    timestamp:   string
}


async function getAllTokenEvents(   
    chainid: number, 
    address: string,
    startBlock: number, 
    endBlock: number,
    interval: number, 
    token: Contract,
    web3: Web3,
    underlying: string
    ) {
    let events: eventData[] = [];
    let start = startBlock;
    let end = endBlock;
    while(true) {
        start = startBlock;
        end = endBlock;
        try {

            while(start <= endBlock) {
                end = start+interval < endBlock ? start+interval : endBlock;

                let chunk = await getEvents(
                    chainid, address, 
                    start+1, end, 
                    events, web3,
                    token, underlying
                );

                events.concat(chunk);
                start = end;
                if(start == endBlock) break;
            }
            break;
            
        }catch (err) {
            console.log("err");
            events = [];
            interval = interval / 2;
        }
    }
    return events;
}


async function getEvents(
    chain:  number,
    token:  string,
    start:  number, 
    end:    number, 
    data:   eventData[],
    web3:   Web3,
    cToken: Contract,
    under:  string
    ) {
    
    if(data.length == 0) {
        data.push({totalSupply: BigInt(0), totalBorrow: BigInt(0), blockNumber: 0, timestamp: ""});
    }


    let events = await cToken.getPastEvents('allEvents', {fromBlock: start, toBlock: end});

    for(let i = 0; i < events.length; i++) {
        let curr = events[i];
        let prevData = data[data.length-1];

        let toAdd: eventData = ({
            totalSupply: prevData.totalSupply, 
            totalBorrow: prevData.totalBorrow, 
            blockNumber: curr.blockNumber,
            timestamp:   ""
        });

        if(curr.event == undefined) { 
            continue;
        }
        // Supply-side cases
        else if(curr.event == 'Mint') {
            toAdd.totalSupply += BigInt(curr.returnValues.mintAmount);
        } 
        else if(curr.event == 'Redeem') {
            toAdd.totalSupply -= BigInt(curr.returnValues.redeemAmount);
        }
        // Borrow-side cases
        else if(curr.event == 'Borrow') {
            toAdd.totalBorrow = BigInt(curr.returnValues.totalBorrows);
        }
        else if(curr.event == "RepayBorrow") {
            toAdd.totalBorrow = BigInt(curr.returnValues.totalBorrows);
        }
        // Liquidation case
        else if(curr.event == 'LiquidateBorrow') {
            toAdd.totalBorrow -= BigInt(curr.returnValues.repayAmount);
        } else {
            continue;
        }

        let timestamp = (await web3.eth.getBlock(curr.blockNumber)).timestamp;
        timestamp = typeof timestamp == "string" ? timestamp : timestamp.toString();
        toAdd.timestamp = timestamp;
        data.push(toAdd);

        try{
        await db.addTokenData(
            chain, 
            timestamp,
            curr.blockNumber,
            token, 
            under,
            toAdd.totalSupply, 
            toAdd.totalBorrow
        );
        db.setCTokenLastUpdated(chain, token, curr.blockNumber);
        } catch (err) {
            console.log(err);
            continue;
        }
    }
    return data;
}




type cTokenResult = {
    chain:      number
    token:      string
    underlying: string
    pool:       string
    name:       string
}

type underResult = {
    underlying: string
    cTokens:    string[]
}

/*
async function addTokenData(tok: string, events: number[], web3: Web3, ntwk: network, pBlock: number) {
    let cToken = new web3.eth.Contract(tokAbi, tok);
    let metadata = (await db.getCTokenMetadata(ntwk.id, tok)).rows;
    let lastUpdated = metadata == undefined ? pBlock: metadata[0].lastupdated;
    let i = 0;
    let curr = 0;
    console.log(events);
    while(i < events.length-1) {
        console.log(events[i]);
        console.log(lastUpdated);
        while(lastUpdated >= events[i]) {
            console.log(i +" " + events.length);
            console.log(lastUpdated);
            console.log(events[i]);
            i ++;
        }

        curr = events[i];

        cToken.defaultBlock = curr;

        let datetime = (await web3.eth.getBlock(curr)).timestamp;
        datetime = isNumberObject(datetime) ? datetime.toString(): datetime;

        try {

            let supply   = (BigInt)(await cToken.methods.totalSupply().call());
            let borrow   =  await cToken.methods.totalBorrowsCurrent().call();
            let liquid   =  await cToken.methods.getCash().call();
            let supRate  =  await cToken.methods.supplyRatePerBlock().call();
            let borRate  =  await cToken.methods.borrowRatePerBlock().call();
            
            await db.addCTokenData(ntwk.id, curr, tok, datetime, supply, borrow, liquid, true);
            await db.setCTokenLastUpdated(ntwk.id, tok, BigInt(curr));
            lastUpdated = events[i];
        } catch (err) {
            console.log(err);
        }
        
    }
    console.log(tok + " done until " + curr);

}
*/



