
// TODO: change info for each chaingg
// TODO: determine if ABI is the same across chains 
export type network = {
    id: number,
    rpc: string,
    dirAddr: string,
    lensAddr: string,
    blocksIn30: number,
    genesisBlock: number
}

export enum MAINNETS {
    "ETHEREUM",
    "ARBITRUM",
    "OPTIMISM",
}

export enum TESTNETS {
    "ROPSTEN",
    "RINKEBY",
    'GOERLI',
    "KOVAN",
    "ARBITRUM_TESTNET",
    "HARDHAT"
}

export const CHAINID: {[key: string]: number } = {
    "ETHEREUM": 1,
    "ETHMAIN": 1,
    "ROPSTEN": 3, 
    "RINKEBY": 4,
    'G\u00D6RLI': 5,
    "KOVAN": 42,
    "ARBITRUM": 42161,
    "ARBITRUM_TESTNET": 421611,
    "OPTIMISM": 10,
    "HARDHAT": 31337

}



// require abis to obtain the json file
export const networks: {[key: number]: network} = {
    1: {
        id: 1,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/LJVLCa0Ry_071ika2ECrnuP2Idk1Z7kS",
        dirAddr: "0x835482FE0532f169024d5E9410199369aAD5C77E",
        lensAddr: "0x6Dc585Ad66A10214Ef0502492B0CC02F0e836eec",
        blocksIn30: 140,
        genesisBlock: 12060711, 
    },
    3: {
        id: 3,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        dirAddr: "",
        lensAddr: "",
        blocksIn30: 140,
        genesisBlock: 12060711,
    }, 
    4: {
        id: 4,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        dirAddr: "",
        lensAddr: "",
        blocksIn30: 140,
        genesisBlock: 12060711,
    },
    5: {
        id: 5,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        dirAddr: "",
        lensAddr: "",
        blocksIn30: 140,
        genesisBlock: 12060711,
    },
    42161: {
        id: 41261,
        rpc: "https://arb-mainnet.g.alchemy.com/v2/rNfYbx5O5Ng09hw9s9YE-huxzVNaWWbX",
        dirAddr: "0xc201b8c8dd22c779025e16f1825c90e1e6dd6a08",
        lensAddr: "0xD6e194aF3d9674b62D1b30Ec676030C23961275e",
        blocksIn30: 140,
        genesisBlock: 12060711,
    },
    421611: {
        id: 42161,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        dirAddr: "",
        lensAddr: "",
        blocksIn30: 140,
        genesisBlock: 12060711,
    },
    10: {
        id: 10,
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        "dirAddr": "",
        "lensAddr": "",
        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    31337: {
        id: 31337,
        rpc: "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
        dirAddr: "",
        lensAddr: "",
        blocksIn30: 140,
        genesisBlock: 12060711,
    }

}
