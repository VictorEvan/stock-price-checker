/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      let like;
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          like = res.body.stockData.likes;
          done();
        });
      });
      
        test('1 stock with like', function(done) {
          this.timeout(10000);
          setTimeout( () => {
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: 'goog', like: true})
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.property(res.body.stockData, 'stock');
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                assert.equal(res.body.stockData.likes, like + 1, 'must increment');
                done();
              });
          }, 5000 );
        });
      
        test('1 stock with like again (ensure likes arent double counted)', function(done) {
          this.timeout(20000);
          setTimeout( () => {
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: 'goog', like: true})
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.property(res.body.stockData, 'stock');
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                assert.equal(res.body.stockData.likes, like + 1, 'must not increment because only 1 like per IP');
                done();
              });
          }, 15000);
        });

        test('2 stocks', function(done) {
          this.timeout(30000);
          setTimeout( () => {
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: ['goog', 'tsla']})
              .end(function(err, res){
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                assert.property(res.body[0].stockData, 'rel_likes');
                assert.property(res.body[1].stockData, 'rel_likes');
                done();
              });
          }, 25000);
        });
      
        test('2 stocks with like', function(done) {
          this.timeout(40000);
          setTimeout( () => {
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: ['goog', 'tsla']})
              .end(function(err, res){
                let accurateGoogleLikes;
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                assert.property(res.body[0].stockData, 'rel_likes');
                assert.property(res.body[1].stockData, 'rel_likes');
                done();
              }); 
          }, 35000 );
        });
      
    });

});
