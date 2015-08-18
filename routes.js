"use strict";

/*
   This file responds to different http requests
*/

var url = require('url');
var fs = require('fs');
var path = require('path');
var Posts = require('./posts');
var RSS = require('./rss');
var OneDay = (1000 * 60 * 60 * 24 * 365);
var favicon = fs.readFileSync(path.resolve(__dirname, './template/img/favicon.ico'));


var rss = new RSS();
var myblog = new Posts();




/*
    Parses a url path to a format that matches our filenames
    
    @param: (String) path - url pathl
*/
function parseFilename (path) {
  if (path === '/') {
    return path;
  }
  
  var separatorIndex = path.lastIndexOf('/')
  var tempFilename;
  var filename;
  
  tempFilename = path.substring(1, separatorIndex) + '_' + path.substring(separatorIndex + 1);
  filename = tempFilename.replace(/\//g, '-');
  
  return filename;
}




/*
    Fetches and loads a page containing a post and passes it to a response method 
    
    @param: (String) filename - name of a file containing a postHtmlContent
    @param: (Object) res - http response object
*/
function loadPage (filename, res) {
    var page = myblog.fetchPost(filename);
    var expires = new Date().getTime() + OneDay;
    
    if (!page) {
      res.writeHead(404);
      res.end('Page not found :(');
    }
    else {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Expires': new Date(expires).toUTCString()
      }); 
      
      res.end(page);   
    }
}



/*
    Loads the rss feed

    @param: (Object) res - http response object    
*/
function loadRSS (res) {
  res.writeHead(200, {
    'Content-Type': 'application/xml; charset=utf-8'
  });
  
  res.end(rss.getFeed());
}






/*
   Expose our routes to the Global module object
*/
module.exports = function (req, res) {
  var path = url.parse(req.url).pathname;
  var filename; 
  
  switch (path) {
    
    case '/':
      loadPage('index', res);
    break;
    
    case '/rss':
      loadRSS(res);
    break;
    
    case '/about':
      filename = parseFilename('/2013/5/9/about-this-blog');
      loadPage(filename, res);
    break; 

    case '/favicon.ico':
      res.writeHead(200, {'Content-Type': 'image/x-icon'} );
      res.end(favicon);
    break;                 
    
    default:
      if (path === '/2014/6/27/using-cheerio-and-mongodb-to-scrap-a-large-website') {
        path = '/2014/6/27/using-cheerio-and-mongodb-to-scrape-a-large-website';
      }

      filename = parseFilename(path);
      loadPage(filename, res);
  }
};
