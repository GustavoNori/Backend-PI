const path = require('path');
const dirname = __dirname;
require('dotenv').config();
require('reflect-metadata');
const { DataSource } = require('typeorm');


const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,    
  port: 3306,
  username: process.env.DB_USER, 
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [
    path.join(dirname, '../entity/User.js'),
    path.join(dirname, '../entity/Company.js'),
    path.join(dirname, '../entity/Job.js'),
    path.join(dirname, '../entity/Application.js'),
    path.join(__dirname, '../entity/Avaliacao.js')
  ],

});

module.exports = {
  AppDataSource,
};