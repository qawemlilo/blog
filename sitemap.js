"use strict";

/*
   Program for generating a sitemap
*/
const XML = require('xml');
const fs = require('fs');


function Sitemap () {
  this.header = '<?xml version="1.0" encoding="UTF-8"?>\n';

  this.json = [{
    urlset: [
      {_attr: {xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9'}}
    ]
  }];

  return this;
}




Sitemap.prototype.add = function (post) {
  this.json[0].urlset.push({
    url: [
      {loc: post.url},
      {lastmod: (new Date(post.lastmod)).toISOString().substring(0, 10)},
      {changefreq: 'weekly'}
    ]
  });
}




Sitemap.prototype.create = function () {
  try {
    let map = this.header + XML(this.json, true);
    fs.writeFileSync('./template/sitemap.xml', map);
    console.log('Sitemap created!');
  } catch (error) {
    throw error;
  }
}




module.exports = new Sitemap();
