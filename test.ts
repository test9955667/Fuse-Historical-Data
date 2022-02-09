

type underResult = {
    chain:      number
    underlying: string
    cTokens:    string[]
}




let underList: underResult[] = [];

let under = "dai";
let ctokens = ["dai-usdc", "dai-usdt"];

let underMeta = underList.find(u => u.underlying == under);

if(!underMeta) {
    underList.push({
        chain:      1,
        underlying: under,
        cTokens:    ctokens.slice(1)
    });
}

underMeta = underList.find(u => u.underlying == under);
if(underMeta) {
    underMeta.cTokens.push(ctokens[0]);
}

let res = underList.find(u => u.underlying == under);
console.log(res);