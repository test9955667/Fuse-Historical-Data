
// TODO: change info for each chaingg
// TODO: determine if ABI is the same across chains 

export const CHAINID = {
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

export const agnostic = {
    "dirABI": "",
    "lensABI": "",
    "cTokenABI": "",
    "poolABI": ""
}

// require abis to obtain the json file
export const networks = {
    1: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "0x835482FE0532f169024d5E9410199369aAD5C77E",

        "lensABI": "",
        "lensAddr": "0x6Dc585Ad66A10214Ef0502492B0CC02F0e836eec",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
        
    },
    3: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    }, 
    4: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    5: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    42161: {
        "rpc": "https://arb-mainnet.g.alchemy.com/v2/rNfYbx5O5Ng09hw9s9YE-huxzVNaWWbX",

        "dirABI": "",
        "dirAddr": "0xc201b8c8dd22c779025e16f1825c90e1e6dd6a08",

        "lensABI": "",
        "lensAddr": "0xD6e194aF3d9674b62D1b30Ec676030C23961275e",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    421611: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    10: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    },
    31337: {
        "rpc": "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",

        "dirABI": "",
        "dirAddr": "",

        "lensABI": "",
        "lensAddr": "",

        "cTokenABI": "",
        "poolABI": "",

        "blocksIn30": 140,
        "genesisBlock": 12060711,
    }

}
