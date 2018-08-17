'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');

var helmet      = require('helmet');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

const { Stock } = require('./models');

const mongoose = require('mongoose');

mongoose.connect(process.env.DB, {useNewUrlParser: true});

const db = mongoose.connection;

// .on (do this function every time first parameter event occurs)
db.on("error", function(err){
	console.error(`connection error: ${err}`);
});

db.once("open", function(){
	console.log("db connection successful");
  Stock.remove(function(err, result) {
    if (err) console.error(err);
    else console.log('all stock docs removed');
  });
});

var app = express();

app.use(helmet.contentSecurityPolicy({
  directives : {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'"]
  }
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors()); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('trust-proxy', true);

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
