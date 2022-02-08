const express = require("express");
const Pool = require("pg").Pool;
import {env} from "../ecosystem.config";
import migrations from "./migrations/migrations";
const app = express();

migrations();
