/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const { setLikeData, getStockData }  = require('./controllers');

// const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.set('trust proxy', true);
  
  app.route('/api/stock-prices')
    .get(setLikeData, getStockData);
};