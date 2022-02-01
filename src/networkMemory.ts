import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";

type contractInfo = {
    abi: AbiItem[],
    addr: string
}

// used to easily access and pass pointers to convenience structures in memeory
export class networkMemory {

    // CONSTANTS 
    readonly CHAIN: number;
    readonly GENESIS: number;
    readonly BLOCKS: number;
    readonly POOL_ABI: AbiItem[];
    readonly TOK_ABI: AbiItem[];
    
    // CONTRACTS
    directory: Contract;
    lens:      Contract;

    // MISC.
    lastUpdated: number;
    web3: Web3;

    // MAPPINGS
    poolContractMap: Map<string, Contract>; // key: cTokenAddress, value cTokenInstance
    poolBlockMap: Map<number, string>; // key: blockNumber, value: cTokenAddress
    cTokenMap: Map<string, Contract>;
    underlyingMap: Map<string, string>; // key: cTokenAddress, value: underlyingAddress
    //cTokenEvents = new Map(); // events branch
    
    constructor(
        chain: number,
        geneis: number,
        blocks: number,
        dirInfo: contractInfo,
        lensInfo: contractInfo,
        cmpABI: AbiItem[],
        tokABI: AbiItem[],
        lastUpdated: number,
        web3: Web3,
        ) {
        // CONSTANT DECLARATIONS
        this.CHAIN = chain;
        this.GENESIS = geneis;
        this.BLOCKS = blocks;
        this.POOL_ABI = cmpABI;
        this.TOK_ABI = tokABI;
        

        this.lastUpdated = lastUpdated;

        // CONTRACT DECLARATIONS
        this.directory = new web3.eth.Contract(dirInfo.abi, dirInfo.addr);
        this.lens = new web3.eth.Contract(lensInfo.abi, lensInfo.addr);
        this.web3 = web3;

        // MAPPING DECLARATIONS
        this.poolContractMap = new Map();
        this.poolBlockMap = new Map();
        this.cTokenMap = new Map();
        this.underlyingMap = new Map();

    }

    setPool(addr: string){
        this.poolContractMap.set(addr, new this.web3.eth.Contract(this.POOL_ABI, addr));
    }

    setCToken(addr: string) {
        this.cTokenMap.set(addr, new this.web3.eth.Contract(this.TOK_ABI, addr));
    }

    setUnderlying(addr: string, underlying: string) {
        this.underlyingMap.set(addr, underlying);
    }

}