import Web3 from 'web3';
const url = "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN";
const cmpAbi = require("./assets/abis/COMPV1.json");

const pool1 = "0x5Fe44D828C2e8a3c9b158501B5A334212F33CD0a";
const pool2 = "0x93de950f609F51b1fF0C5bf81d8588fBAdDe7d5C";

const web3 = new Web3(new Web3.providers.HttpProvider(url));

const p1 = new web3.eth.Contract(cmpAbi, pool1);
const p2 = new web3.eth.Contract(cmpAbi, pool2);

async function call() {
    let res1 = await p1.methods.getAllMarkets().call();
    let res2 = await p2.methods.getAllMarkets().call();

    console.log("pool 1, markets.length: " + res1.length);
    console.log("pool 2, markets.length: " + res2.length);
}
call();


