const https = require('https');

const { IP }    = require('../models');
const { Stock } = require('../models');

module.exports.setLikeData = function(req, res, next) {
  const getLikeObject = (stock , done) => {
    let update = {};
    const query = {stock};
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    req.likes = {};
    if (req.query.like === 'true') {
      console.log('like is true');
      Stock.findOne(query, (err, stockDoc) => {
        if (err) return console.error(err);
        // if document doesn't exist, make one and add IP
        if (!stockDoc) {
          const newStockWithLike = new Stock({
            stock,
            ips: [ { ip: req.ip } ],
            likes: 1
          });
          newStockWithLike.save((err, doc)=>{
            if (err) return console.error(err);
            else {
              console.log('doc: ', doc);
              req.likes[stock] = doc.likes;
              done();
            }
          });
        // if document does exist, check if IP is already there
        } else {
          console.log('stockDoc: ', stockDoc);
          const foundIp = stockDoc.ips.filter( ipDoc => ipDoc.ip === req.ip).pop();
          if (foundIp) {
            console.log('found IP: ', foundIp);
            req.likes[stock] = stockDoc.likes;
            done();
          } else {
            console.log('did not find IP');
            update = { $inc: {likes: 1}, $push: { ips: { ip: req.ip } } };
            Stock.findOneAndUpdate(query, update, options, (err, doc) => {
              if (err) return console.error(err);
              console.log('doc: ', doc);
              req.likes[stock] = doc.likes;
              done();
            });
          }
        }
      });
    } else {
      Stock.findOneAndUpdate(query, update, options, (err, doc) => {
        if (err) return console.error(err);
        console.log('doc: ', doc);
        req.likes[stock] = doc.likes;
        done();
      });
    }
  };
  req.likes = {};
  if (typeof req.query.stock === 'string') {
    console.log('single stock likes');
    getLikeObject(req.query.stock.toUpperCase(), () => {
      return next();
    });
  } else if (typeof req.query.stock === 'object') {
    if (req.query.stock.length > 2) return res.json({error: 'max of two stocks per query'});
    const requests = req.query.stock.map( stock => {
      return new Promise( resolve => {
        stock = stock.toUpperCase();
        getLikeObject(stock, resolve);
      });
    });
    Promise.all(requests).then( () => {
      console.log('begin processing relative likes!');
      console.log('req.likes: ',req.likes);
      let stockLikeCount;
      let firstStock;
      req.rel_likes = {};
      for (let stock in req.likes) {
        console.log('stock: ', stock);
        if (stockLikeCount) {
          req.rel_likes[stock] = req.likes[stock] - stockLikeCount;
        }
        else {
          firstStock = stock;
        }
        stockLikeCount = req.likes[stock];
        
      }
      req.rel_likes[firstStock] = req.likes[firstStock] - stockLikeCount;
      console.log('req.rel_likes: ',req.rel_likes);
      next();
    });
  }
}

module.exports.getStockData = function(req, res) {
  const getStockObject = done => { https.get(url, getRes => {

    let body = "";

    getRes.on('data', d => {
      body += d.toString(); // read data
    });
    getRes.on('error', e => {
      console.error(e);
    });
    getRes.on('end', () => {
      // parse data
      const stockData = JSON.parse(body);
      // too many API calls scenario
      if (stockData.Information) {
        console.error('too many API calls!!!');
        res.json({error: 'too many API calls at once'});
        return;
      }
      // get needed data for response
      let stockPrice;
      for (let stockInterval in stockData["Time Series (1min)"]) {
        stockPrice = stockData["Time Series (1min)"][stockInterval]["4. close"];
        break;
      }
      // build stock object
      const stock = {
        "stockData": {
          stock: stockData["Meta Data"]["2. Symbol"],
          price: stockPrice
        }
      };
      // return data
      done(stock);
    });
  })};
  console.log('start getStockData');
  let stock = req.query.stock;
  let url;
  if (typeof stock === 'object') {
    const stockObjects = [];
    // function to be performed asynchronously
    const buildStockArray = (stock, done) => {
      stock = stock.toUpperCase();
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${stock}&interval=1min&outputsize=compact&apikey=${process.env.KEY}`;
      getStockObject( stockObject => {
        console.log('get Stock Object for: ', stock);
        stockObject.stockData.rel_likes = req.rel_likes[stock];
        stockObjects.push(stockObject);
        done();
      });
    };
    // asynchronous execution
    let requests = stock.map( stock => {
      return new Promise( resolve => {
        buildStockArray(stock, resolve);
      });
    });
    Promise.all(requests).then( () => {
      console.log('all done!');
      console.log('final return object: ', stockObjects);
      return res.json(stockObjects);
    });
  } else if (typeof stock === 'string') {
    console.log('single stock');
    stock = stock.toUpperCase();
    url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${stock}&interval=1min&outputsize=compact&apikey=${process.env.KEY}`;
    getStockObject(stockObject=>{
      stockObject.stockData.likes = req.likes[stock];
      console.log('final return: ', stockObject);
      return res.json(stockObject);
    });
  }
};