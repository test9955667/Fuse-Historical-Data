const express = require("express");
const Pool = require("pg").Pool;
import {env} from "../ecosystem.config";
import migrations from "../migrations/migrations";
import * as setup from "./SetupData";
const app = express();


// call migrations 
async function run() {
    await migrations();
    console.log("HERE");
    // call setup
    setup.default();
}
run();


// call fill history

// call concurrent