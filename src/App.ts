import express from "express";
const Pool = require("pg").Pool;
import {env} from "../ecosystem.config";
import migrations from "./migrations/migrations";
import * as setup from "./utils/SetupData";
const router = require('./api/router');

const app = express();

// All endpoints deferred to router
app.use("/api", router);

run();
async function run() {
    // call migrations 
    await migrations();
    // call setup
    await setup.default();

}


const listener = app.listen(3000, () => {
    console.log('Your app is listening on port 3000')
})
