import * as db from '../dbOperations/Queries';

// Example request: 'url/ctoken/history?chain=CHAINID&token=TOKENADDRESS&start=STARTSTAMP&end=ENDSTAMP'
export const getToken = async (req: any, res: any, next: any) => {

    try{
        let data = await db.getRangeSingle(
            req.params.chain, 
            req.params.addr, 
            req.params.start,
            req.params.end
            );
        res.json(data);
    } catch (err) {
        res.json("error fetching token data");
    }

    next();
    return;
}



export const getUnderMeta = async (req: any, res: any, next: any) => {

}


module.exports = {
    getToken
}