*Edit:* Fixed spelling errors. 

A friend of mine is building a web application that provides services to local businesses and he needed to collect contact details of as many companies as possible. 
After doing some research, he discovered that the best resource that provided information about local business was our Yellow Pages website. In his infinite wisdom, he decided to recruite me to write a bot that collected all the data he required from the Yellow Pages website.

*Disclaimer:* Scraping has a moral grey area, as much as the information on a website is publicly available, I don't think that mass cloning the data is morally upright.


### The Plan
Building a scraping bot requires 2 main things, a collection of urls that you want to scrape and a module that parses HTML. In this particular project we were very lucky because the website we were scraping had well structured urls that seemed to use database id feilds to load information for a particular business.

The urls looked something like this `http://localyellowpages.com/listing/27`. All I had to do was run a loop that created all urls starting from 1 and stopping at largest id that we found.

The function that took care of creating our url collection looks like this:

    function generateUrls(limit) {
      var url = 'http://localyellowpages.com/listing/';
      var urls = [];
      var i;

      for (i=1; i < limit; i++) {
        urls.push(url + i);
      }

      return urls;
    }

Once the collection was created I needed to load each page individually using the http module, parse the HTML to access the contact details of a business and then store the details in MongoDB.

### Choosing Cheerio
[Cheerio](https://github.com/cheeriojs/cheerio) is an awesome server side DOM manipulation module, I have used it in previous projects like [CrushIt](http://blog.ragingflame.co.za/2013/2/8/crushit) and totally loved it. With cheerio, you can access DOM elements the same way you do with jQuery on the browser. Here is an example:

    var cheerio = require('cheerio');
    var html = '<div><ul><li>1</li><li id="mynum">2</li><li>3</li></ul></div>';

    var $ = cheerio.load(html);

    // get my number
    var mynum = $('#mynum').text();

    console.log(mynum) // logs 2

Easy as pie!

### The Bot
Armed with cheerio and a hacker attitude I went straight to work. The largest id we found was 25000, meaning that the website had about that number of entries minus any that were deleted.

### Dependencies
 - Cheerio - for parsing HTML
 - Mongoose - for storing our data in MongoDB

The bot comprises of 4 files:

 - `bot.js` - the main execution file
 - `model.js` - MongoDB model for storing data 
 - `scraper.js` - scraping constructor
 - `package.json` - metadata 


### Model.js
Creating a model first is good because it defines clearly the data that you want to collect, in this case we wanted detailed contact information.

    var mongoose = require('mongoose');

    mongoose.connect('mongodb://localhost:27017/scraper');
    mongoose.connection.on('error', function() {
      console.error('MongoDB Connection Error. Make sure MongoDB is running.');
    });

    var ListingsSchema = new mongoose.Schema({
      title: String,
      email: {type: String, lowercase: true},
      cell: Array,
      telephone: Array,
      fax: Array,
      website: {type: String, default: '', lowercase: true},
      postalAddress: Array,
      address: Array,
      url: String
    });

    module.exports = mongoose.model('Listings', ListingsSchema);

The model basically defines all fields we want to collect - `cell`, `telephone` and `fax` are arrays because there were cases where a business would have more than one number. The `address` and `postalAddress` were also split into arrays for convenience when querying.

### Scraper.js
My first attempt at loading pages and parsing them was a disaster, the bot tried to load all 25000 pages at the same time. After some deliberation I decided to  create the Scraper as an EventEmitter and Constructor that fired a `complete` event when it was done parsing a page. This would make it possible to process my urls in batches.

    var http = require('http');
    var cheerio = require('cheerio');
    var util = require('util');
    var EventEmitter = require('events').EventEmitter;
    var STATUS_CODES = http.STATUS_CODES;


    /*
     * Scraper Constructor
    **/
    function Scraper (url) {
        this.url = url;

        this.init();
    }


    /*
     * Make it an EventEmitter
    **/
    util.inherits(Scraper, EventEmitter);

I started by defining my Scraper Constructor and turning it into an EventEmitter. When instantiated, it calls the `init` method.

Up next let's look at the `init` method.

    /*
     * Initialize scraping
    **/
    Scraper.prototype.init = function () {
        var model;
        var self = this;

        self.on('loaded', function (html) {
            model = self.parsePage(html);
            self.emit('complete', model);
        });

        self.loadWebPage();
    };

The `init` method attaches an event listener to the Scraper's `loaded` event, when that event fires, it comes with some HTML which is parsed before being passed to a `complete` event listener. Lastly the `init` method calls the `loadWebPage` method.

    Scraper.prototype.loadWebPage = function () {
      var self = this;

      console.log('\n\nLoading ' + website);

      http.get(self.url, function (res) {
        var body = '';
        
        if(res.statusCode !== 200) {
          return self.emit('error', STATUS_CODES[res.statusCode]);
        }

        res.on('data', function (chunk) {
          body += chunk;
        });

        res.on('end', function () {
          self.emit('loaded', body);
        });
      })
      .on('error', function (err) {
        self.emit('error', err);
      });       
    };


    /*
     * Parse html and return an object
    **/
    Scraper.prototype.parsePage = function (html) {
      var $ = cheerio.load(html);

      var address = $('#address').text();
      var tel = $('#tel').text();
      var cell = $('#cell').text();
      var fax = $('#fax').text();
      var email = $('#email').text();
      var website = $('#website').attr('href');
      var postal =  $('#postal').text();

      var model = {
        title: address.trim().split('\n'),
        email: email.trim(),
        cell: cell.trim().split('\n'),
        telephone: tel.trim().split('\n'),
        fax: fax.trim().split('\n'),
        website: website || '',
        postalAddress: postal.trim().split('\n'),
        address: address.trim().split('\n'),
        url: this.url
      };

      return model;
    };


    module.exports = Scraper;

`loadWebPage` is pretty straight forward, it loads a web page using the native `http` module and then fires the `loaded` event once complete.

`parsePage` is used to traverse the HTML DOM and gather the required data - it really devepends on the page layout, you should first check the source code of the pages you are parsing before creating your own parser method.


### bot.js
The final piece of the puzzle is completed in `bot.js`, we first require our model and scraper. Earlier on I created the `generateUrls` function which is also included in `bot.js`.

    var Model = require('./model');
    var Scraper = require('./scraper');
    var Pages = [];


    function generateUrls(limit) {
      var url = 'http://localyellowpages.com/listing/';
      var urls = [];
      var i;

      for (i=1; i < limit; i++) {
        urls.push(url + i);
      }

      return urls;
    }


    // store all urls in a global variable   
    Pages = generateUrls(25000);


    function wizard() {
      // if the Pages array is empty, we are Done!!
      if (!Pages.length) {
        return console.log('Done!!!!');
      }

      var url = Pages.pop();
      var scraper = new Scraper(url);
      var model;

      console.log('Requests Left: ' + Pages.length);

      // if the error occurs we still want to create our
      // next request
      scraper.on('error', function (error) {
        console.log(error);
        wizard();
      });

      // if the request completed successfully
      // we want to store the results in our database
      scraper.on('complete', function (listing) { 
        model = new Model(listing);
        
        model.save(function(err) {
          if (err) {
            console.log('Database err saving: ' + url);
          }
        });

        wizard();
      });
    }

Details of how things work are contained in the comments - `wizard` is basically a recursive function that goes on until the `Pages` array is empty.

Lastly let us create our first batch and fire away!

    var numberOfParallelRequests = 20;

    for (var i = 0; i < numberOfParallelRequests; i++) {
      wizard();
    }

The variable `numberOfParallelRequests` works like a tap that controls the speed and number of simultenious requests being processed at one particular moment.

    // run the bot
    node bot.js

And we are done! Sit back, grab a beer and watch Node.js scraping like a BOSS. 

Remember, with great power comes a greater responsibility - use Node for good and not for evil. Keep hacking.



