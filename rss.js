"use strict";

/*
  This file contains the program for creating an rss feed
*/


const Feed = require('rss');
const config = require('./config.json');

const feed = new Feed({
    title: config.blog.name,
    description: config.blog.description,
    feed_url: config.blog.url + config.blog.rss,
    site_url: config.blog.url,
    author: config.author.name
});



/*
    rss constructor function
*/
function RSS() {
    this.xml = false;

    return this;
}


/*
    Creates rss feed
*/
RSS.prototype.getFeed = function () {
  if (this.xml) {
    return this.xml;
  }

  let posts = require('./posts.json');
  let xml;
  let i;
  let limit = config.blog.rssLimit > posts.length ? posts.length : config.blog.rssLimit;

  // latest posts first
  posts.reverse();

  for (i = 0; i < limit; i++) {
    feed.item({
      title: posts[i].title,
      description: posts[i].description,
      url: config.blog.url + posts[i].url,
      guid: posts[i].id,
      author: posts[i].author,
      date: posts[i].date
    });
  }

  this.xml = feed.xml();

  return this.xml;
};


module.exports = RSS;
