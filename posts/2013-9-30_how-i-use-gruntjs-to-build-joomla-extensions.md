JavaScript is my first love but the bulk of my paid work involves writing a lot of PHP for Joomla! CMS. Joomla! CMS is a powerful piece of software that is extendable through extensions. These extensions give you the powerful ability to turn the CMS into any application that tickles your fancy.

Building Joomla! extensions can be cumbersome because their architacture follows a strict MVC pattern. Once all the necessary files have been created you need to compress them into a zip file that is installable via the CMS backend.

Since I started using Gruntjs I have automated my development process in a number of ways that has greatly increased my productivity and eliminated some of the boring monotonous tasks. 

These are the ways that I'm using Gruntjs to build Joomla! Extensions.

### Automatically generated extension templates

I am using grunt-init to automatically generate the base code and files for my extensions. I have created a grunt-init template that is copied to my project by simply openning my project directory from the commandline shell and running the command `grunt-init my-extension-template`. This will prompt me for all the required metadata and then create my files.


### Automatically generated views, models and controllers

I have also written a plugin that generates boilerplate code and files for my views, models, and controllers. All I need do is type the command and pass in the name of the new item, e.g `grunt joomla:view` will prompt me for a name and then create all the `view` files.

    joomla: {
        model: {          
            files: [
                {tmpl: 'tmpl/com/model.tmpl', dest: 'com_mycomponent/site/models/<%= view %>.php'},
                {tmpl: 'tmpl/com/table.tmpl', dest: 'com_mycomponent/site/models/tables/<%= view %>.php'}
            ]
        },
        
        view: {          
            files: [
                {tmpl: 'tmpl/com/view.tmpl', dest: 'com_mycomponent/site/views/<%= view %>/view.html.php'},
                {tmpl: 'tmpl/com/default.tmpl', dest: 'com_mycomponent/site/views/<%= view %>/tmpl/default.php'},
                {tmpl: 'tmpl/com/xml.tmpl', dest: 'com_mycomponent/site/views/<%= view %>/tmpl/default.xml'}
            ]
        },
        
        controller: {          
            files: [
                {tmpl: 'tmpl/com/controller.tmpl', dest: 'com_mycomponent/site/controllers/<%= view %>.php'}
            ]
        }
    }
    

### JSHinting JavaScript files

JSHint is a JavaScript quality tool that helps to detect errors and potential problems in your JavaScript code. [Visit the JSHint page to learn more](http://www.jshint.com).


    jshint: {
        all: [
            'Gruntfile.js',
            'com_mycomponent/*.js'
        ],
        
        options: {
            jshintrc: '.jshintrc'
        }
    }


### Creating compressed files

When I'm writing code my commandline shell is always open and I find it easier to run most desktop operations from there. Instead of opening the file system to create compressed zip files for my extensions I simply run a Gruntjs task that generates that file for me. No more time wasted deleting files first and responding to pop up dialog boxes. For this task I use a plug in called compress.  


    compress: {
        component: {
            options: {
                archive: "build/com_mycomponent.zip"
            },
            
            files: [
                {cwd: 'com_mycomponent/', src: ['**/*'], expand: true, dest: ''}, 
            ]
        }
    }


## Validating PHP files

Before I build a zipped file for extension I run JSHint to validate the JavaScript and I also run a PHP command that checks for syntanx errors in my php files. For this I use a plugin called grunt-exec. I have modified the original grunt-exec plugin so that I can pass a custom function to the child_process's 'data' event, [you can checkout my pull request for this feature](https://github.com/jharding/grunt-exec/pull/31). If validation fails the process will exit.


    exec: {
        testphp: {
            cmd: "find ./com_mycomponent -name '*.php' -exec php -l {} ;",

            onOutData: function (data) {
                console.log(data);

                if (data.match(/Errors parsing|PHP Parse error/g)) {
                    process.exit(1);
                }
            },

            onErrData: function (data) {
                console.log(data);

                if (data.match(/Errors parsing|PHP Parse error/g)) {
                    process.exit(1);
                }
            }
    }
 

Now I don't have to leave the commandline to perform trivial tasks like compressing zip files. It feels awesome!
