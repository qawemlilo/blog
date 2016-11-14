"use strict";

/*
   This file responds to different http requests
*/

const _ = require('lodash');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Posts = require('./posts');
const postsDB = require('./posts.json');
const DynamicPage = require('./lib/dynamicpage');
const config = require('./config');
const RSS = require('./rss');
const OneDay = (1000 * 60 * 60 * 24 * 365);
const favicon = fs.readFileSync(path.resolve(__dirname, './template/img/favicon.ico'));


const rss = new RSS();
const myblog = new Posts();

const dynamicPage = new DynamicPage({
  js: config.blog.scriptMin,
  css: config.blog.cssMin
});




/*
    Parses a url path to a format that matches our filenames

    @param: (String) path - url pathl
*/
function parseFilename (path) {
  if (path === '/') {
    return path;
  }

  let separatorIndex = path.lastIndexOf('/')
  let tempFilename;
  let filename;

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
    let page = myblog.fetchPost(filename);
    let expires = new Date().getTime() + OneDay;

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
    Fetches and loads a page containing a post and passes it to a response method

    @param: (String) filename - name of a file containing a postHtmlContent
    @param: (Object) res - http response object
*/
function loadDynamicPage (posts, res) {
    var page = dynamicPage.init({
      posts: posts
    });
    var expires = new Date().getTime() + OneDay;

    if (!page) {
      res.writeHead(404);
      res.end('DynamicPage Page not found :(');
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
module.exports = function (app) {

  app.get('/', function(req, res) {
    loadPage('index', res);
  });

  app.get('/favicon.ico', function(req, res) {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end(favicon);
  });

  app.get('/rss', function(req, res) {
    loadRSS(res);
  });

  app.get('/about', function(req, res) {
    let filename = parseFilename('/2013/5/9/about-this-blog');

    loadPage(filename, res);
  });

  app.get('/:year', function(req, res) {

    let posts = _.filter(postsDB, function (post) {
      return post.year === parseInt(req.params.year, 10);
    });

    loadDynamicPage(posts, res);
  });

  app.get('/tags/:tag', function(req, res) {

    let posts = _.filter(postsDB, function (post) {
      return post.categories.indexOf(req.params.tag) > -1;
    });

    loadDynamicPage(posts, res);
  });

  app.get('/:year/:month', function(req, res) {

    let posts = _.filter(postsDB, function (post) {
      return post.year === parseInt(req.params.year, 10) && post.month === parseInt(req.params.month, 10);
    });

    loadDynamicPage(posts, res);
  });

  app.get('/:year/:mon/:day/:title', function(req, res) {
    let title = req.params.title;

    if (title === 'using-cheerio-and-mongodb-to-scrap-a-large-website') {
      title = 'using-cheerio-and-mongodb-to-scrape-a-large-website';
    }

    let filename = parseFilename('/' + req.params.year + '/' + req.params.mon + '/' + req.params.day + '/' + title);

    loadPage(filename, res);
  });
};
