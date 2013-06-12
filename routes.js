

/*
   This file responds to different http requests
*/


var url = require('url'),
    exec = require('child_process').exec,
    Posts = require('./posts'), 
    RSS = require('./rss'),
    OneDay = (1000 * 60 * 60 * 24 * 365),
    rss, 
    myblog;
    
rss = new RSS();
myblog = new Posts();



/*
    Parses a url path to a format that matches our filenames
    
    @param: (String) path - url pathl
*/
function parseFilename (path) {
    "use strict";
    
    if (path === '/') {
        return path;
    }
    
    var separatorIndex = path.lastIndexOf('/'), tempFilename, filename;
    
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
    "use strict";
    
    var page = myblog.fetchPost(filename),
        expires = new Date().getTime() + OneDay;
    
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
    "use strict";
    
    res.writeHead(200, {
        'Content-Type': 'application/xml; charset=utf-8'
    });
    
    res.end(rss.getFeed());
}



/*
    Post receive hook handler for updating heroku repo  

    @param: (Object) res - http response object    
*/
function gitPull (res) {
    "use strict";
    
    exec('git pull origin master', function (error, stdout, stderr) {
        if (error) {
            throw error;
        } 
        
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
    });
    
    res.writeHead(200);
    res.end('Done');
}




/*
   Expose our routes to the Global module object
*/
module.exports = function (req, res) {
    "use strict";
    
    var path = url.parse(req.url).path, filename; 
    
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

        case '/pull':
            gitPull(res);
        break;
        
        default:
            filename = parseFilename(path);
            loadPage(filename, res);
    }
};
