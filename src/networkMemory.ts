import { AbiItem  } from "web3-utils";
import { Contract } from "web3-eth-contract";
import Web3 from "web3";

type contractInfo = {
    abi: AbiItem[],
    addr: string
}

// used to read / write memory easily without redundant object initialization and chain/db searching
export class networkMemory {

    /*////////////////////
         DECLARATIONS
    ////////////////////*/

    // UNINITIALIZED DECS
    poolsBlockList: number[] = [];

    // CONSTANT DECS 
    readonly CHAIN:    number;
    readonly BLOCKS:   number;
    readonly GENESIS:  number;
    readonly TOK_ABI:  AbiItem[];
    readonly POOL_ABI: AbiItem[];

    // CONTRACT DECS
    lens:      Contract;
    directory: Contract;

    // MISC. DECS
    web3:        Web3;
    lastUpdated: number;

    // MAPPING DECS
    cTokenMap:       Map<string, Contract>; // key: cTokenAddress, value: cToken contract instance
    poolBlockMap:    Map<number, string>;   // key: blockNumber, value: cTokenAddress
    underlyingMap:   Map<string, string>;   // key: cTokenAddress, value: underlyingAddress
    poolContractMap: Map<string, Contract>; // key: poolAddress, value pool contract instance
    //cTokenEvents:  Map<>; // events branch


    /*////////////////////
          CONSTRUCTOR
    ////////////////////*/

    constructor(
        web3:        Web3,
        chain:       number,
        geneis:      number,
        blocks:      number,
        cmpABI:      AbiItem[],
        tokABI:      AbiItem[],
        dirInfo:     contractInfo,
        lensInfo:    contractInfo,
        lastUpdated: number,
    ) {

        // CONSTANT INIT
        this.CHAIN    = chain;
        this.BLOCKS   = blocks;
        this.GENESIS  = geneis;
        this.TOK_ABI  = tokABI;
        this.POOL_ABI = cmpABI;
        
        // CONTRACT INIT
        this.lens      = new web3.eth.Contract(lensInfo.abi, lensInfo.addr);
        this.directory = new web3.eth.Contract(dirInfo.abi, dirInfo.addr);

        // MISC     INIT
        this.web3        = web3;
        this.lastUpdated = lastUpdated;

        // MAPPING  INIT
        this.cTokenMap       = new Map();
        this.poolBlockMap    = new Map();
        this.underlyingMap   = new Map();
        this.poolContractMap = new Map();
    }


}
