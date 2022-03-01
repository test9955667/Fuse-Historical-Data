import express from 'express';
import * as routes from './routes';

const router = express.Router();


router.get("/ctoken/history/:chain-:addr-:start-:end", routes.getToken);


// router.post("/ctoken/metadata", controller.)

module.exports = router;