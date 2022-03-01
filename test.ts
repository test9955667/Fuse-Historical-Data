const cAbi = require('./src/assets/abis/TOKV1.json'); 

import { time, timeStamp } from 'console';
import Web3 from 'web3';



const url = "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN";

const addr = "0x95FD9Ac18D72C84D47442181828202b9ec8419C6";


const web3 = new Web3(new Web3.providers.HttpProvider(url));

const cToken = new web3.eth.Contract(cAbi, addr);

// Lend:
// Accrue => cashPrior = totalSupply before txn accrue, transfer, redeem 
// Redeem => redeemAmt = amount to decrease totalSupply by
// Mint   => mintAount = amount to increase totalSupply by accrue, mint, transfer

// Borrow: 
// Repay => repayAmount = amount to decrease totalBorrows by 
// Borrow => borrowAmount = amount to increase totalBorrow by 
// Borrow => totalBorrows = totalBorrows (underlying)

// Liquidate: repay , liquidate 

type eventData = {
    totalSupply: bigint,
    totalBorrow: bigint,
    blockNumber: number,
    timestamp  : number
}

async function getEvents() {
    let data: eventData[] = [];
    data.push({totalSupply: BigInt(0), totalBorrow: BigInt(0), blockNumber: 0, timestamp: 0});

    let events = await cToken.getPastEvents('allEvents', {fromBlock: 12060820, toBlock: 12710379});

    for(let i = 0; i < events.length; i++) {
        let curr = events[i];
        let prevData = data[data.length-1];
        
        let toAdd: eventData = ({
            totalSupply: prevData.totalSupply, 
            totalBorrow: prevData.totalBorrow, 
            blockNumber: curr.blockNumber,
            timestamp: 0
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

       // let timestamp = (await web3.eth.getBlock(curr.blockNumber)).timestamp;
        //timestamp = typeof timestamp == "number" ? timestamp : Number(timestamp);
        //toAdd.timestamp = timestamp;
        console.log(toAdd);
        data.push(toAdd);

    }


    
}

getEvents();