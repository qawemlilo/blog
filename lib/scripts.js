
var UglifyJS = require('uglify-js');
var config = require('../config');
var path = require('path');
var del = require('del');


module.exports = function () {
  console.log('Minifying scripts.......');

  var delList = ['template/js/*.js'];
  var result = UglifyJS.minify(config.blog.scripts);

  config.blog.scripts.forEach(function (file) {
  	delList.push('!template/js/' + file);
  });

  del.sync(delList);

  

  result.code;
};