
var CleanCSS = require('clean-css');
var config = require('../config');
var path = require('path');
var del = require('del');


module.exports = function () {

  console.log('Minifying css.......');

  var delList = ['template/css/*.css'];

  config.blog.css.forEach(function (file) {
  	delList.push('!template/css/' + file);
  });

  del.sync(delList);

  var result = new CleanCSS().minify(config.blog.css);

  return result.styles;
};