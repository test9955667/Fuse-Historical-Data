const express = require("express");
const app = express();
const port = 3000;
const Sequelize = require('sequelize');
import { env } from "../ecosystem.config";

const sequelize = new Sequelize(
    ('postgres://'+env.user+':'+env.pass+'@'+
    env.host+':'+env.port+'/'+ env.db),
    {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });


sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((err: any) => {
    console.error('Unable to connect to the database:', err);
});