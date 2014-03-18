
/*
   Blog http server
*/

var http = require('http'),
    connect = require('connect'),
    st = require('st'),
    port = process.env.PORT || 3080,
    routes = require('./routes'), 
    app,
    mount,
    OneDay = (1000 * 60 * 60 * 24);


mount = st({
    path: __dirname + '/template', // resolved against the process cwd
    
    url: '/', // defaults to '/'
    
    cache: { // specify cache:false to turn off caching entirely
        fd: {
          max: 100, // number of fd's to hang on to
          maxAge: OneDay, // amount of ms before fd's expire
        },
        
        stat: {
          max: 500, // number of stat objects to hang on to
          maxAge: OneDay, // number of ms that stats are good for
        },
        
        content: {
          max: 1024*10, // how much memory to use on caching contents
          maxAge: OneDay, // how long to cache contents for
        }
    },
    
    index: false, // return 404's for directories
    
    dot: true, // allow dot-files to be fetched normally
    
    passthrough: true // calls next/returns instead of returning a 404 error
});


    
app = connect()
  .use(mount)
  .use(connect.compress())
  .use(routes);


http.createServer(app).listen(port, function() {
    console.log('Blog server running at port %s', port);
});
