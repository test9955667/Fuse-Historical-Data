const Sequelize = require('sequelize');
import {env} from '../ecosystem.config';




const sequelize = new Sequelize(
    'postgres://'+
    env.user+':'
    +env.pass+'@'
    +env.host+':5432/'
    + env.db,
    {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false
            }
        }
    });


sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((err: any) => {
    console.error('Unable to connect to the database:', err);
});