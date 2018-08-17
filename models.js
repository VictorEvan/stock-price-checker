const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const IPSchema = new Schema({
  ip: {type: String, required: true}
});

IPSchema.method('addIP', function(ip, done){
  this.ip = ip;
  this.parent().save(done);
});

const StockSchema = new Schema({
  stock: {type: String, required: true},
  likes: {type: Number, default: 0},
  ips: [IPSchema]
});

module.exports.Stock = mongoose.model('Stock', StockSchema);