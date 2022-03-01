import axios from 'axios';
import { SequelizeScopeError } from 'sequelize/dist';
const url = "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN";

type priceData = {
    blockNum: number,
    price: number,
}

axios.defaults.headers.common = {
    "X-API-Key": "cLxgm1WH6iXBq5SRkcBmGXl59epysUqrUIxZ25kaBILbDcQaCOf1299lrkbV03NE",
  };

// Optimized for free plan, 8 calls per second 
async function getUnderlyingPrice(
    chain:      string,
    address:    string,
    startBlock: number,
    endBlock:   number,
    interval:   number
    ) {
    let prices: priceData[] = [];
    let count = 0;
    while(startBlock <= endBlock) {
        // 8 calls per second 

        let req = `https://deep-index.moralis.io/api/v2/erc20/${address}/price?chain=${chain}&to_block=${startBlock}`;
        if (count == 7) {  await sleep(1000); count = 0;}
        axios.get(req)
        .then(function (res) {
        prices.push({blockNum: startBlock, price: res.data.usdPrice});
        console.log(startBlock);
        })
        .catch(function (error) { console.log(error); sleep(1000);});

        startBlock+=interval;
        count++;
    }

    console.log(prices);

}

const sleep = (millis: number) => {
    return new Promise(resolve => setTimeout(resolve, millis));
}
getUnderlyingPrice("eth", "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",13060739,14280652,140);
