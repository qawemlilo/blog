Lately, Grunt has completely taken over my development process. In one of my previous posts I explained [how I use Gruntjs to develop Joomla! extenstions](http://blog.ragingflame.co.za/2013/9/30/how-i-use-gruntjs-to-build-joomla-extensions).

Today I would like to take a closer look at one Gruntjs plugin that I have been using, [grunt-exec](https://github.com/jharding/grunt-exec). [grunt-exec](https://github.com/jharding/grunt-exec) is a plugin for executing shell commands. I have 2 shell commands that I use the most when working on a project:

The first one removes the backup files created by text editors. It filters all files ending with the charecter `~` in the current working directory and sub-directories. I run this command everytime I perform a clean up.

    find . -type f -name "*~" -exec rm -f {} \;

I use the second command in my PHP projects to check for syntax errors in php files.  I run this command just before packaging my project into a zip file.

    find . -type f -name '*.php' -exec php -l {} \;

Below is how my Gruntfile for executing these commands looks like.

    module.exports = function(grunt) {
        grunt.initConfig({
            exec: {
              test: {
                cmd: "find . -type f -name '*.php' -exec php -l {} ;",
                
                callback: function (error, stdout, stderr) {
                    grunt.log.write('stdout: ' + stdout);
                    grunt.log.write('stderr: ' + stderr);
                    
                    if (error !== null) {
                        grunt.log.error('exec error: ' + error);
                    }
                }
              },
              
              clean: {
                cmd: 'find . -type f -name "*~" -exec rm -f {} ;'
              }
            },
        
            compress: {
              project: {
                options: {
                  archive: './com_project.zip'
                },
              
                files: [
                  {cwd: 'component/', src: ['**/*'], expand: true, dest: ''}
                ]
              }
            }
        });
        
        grunt.loadNpmTasks('grunt-exec');
        grunt.loadNpmTasks('grunt-contrib-compress');
        grunt.registerTask('default', ['exec', 'compress']);
    };  

The problem that I encountered with [grunt-exec](https://github.com/jharding/grunt-exec) is that it buffers output, which is inconvenient if you want to check each operation output individually. What I wanted was the ability to exit the Node process if any php file had syntax errors and prevent the zip file from being created.

So I dived into the [grunt-exec](https://github.com/jharding/grunt-exec) code to see if I could solve the problem. [grunt-exec](https://github.com/jharding/grunt-exec) uses the `exec` method of the [Child Process](http://nodejs.org/api/child_process.html) module to execute commands. When the `exec` method is called it returns the `ChildProcess object` which is an event emitter. Bingo! All I needed to do was pass functions that accept the data event emitted by `ChildProcess object`'s `stdout` and `stderr` streams. I then replaced the callback option with 2 ondata event handlers.

What the 2 functions do is check if the emitted data contains error reports, if so, exit the Node process.

    module.exports = function(grunt) {
        grunt.initConfig({
            exec: {
                test: {
                    cmd: "find . -type f -name '*.php' -exec php -l {} ;",
                    
                    onOutData: function (data) {
                      if (data.match(/Errors parsing|PHP Parse error/g)) {
                        grunt.log.error(data);
                        process.exit(1);
                      }
                      else {
                        grunt.log.write(data);
                      }
                    },
                    
                    onErrData: function (data) {
                      if (data.match(/Errors parsing|PHP Parse error/g)) {
                        grunt.log.error(data);
                        process.exit(1);
                      }
                      else {
                        grunt.log.write(data);  
                      }
                    }
                },
                
                clean: {
                    cmd: 'find . -type f -name "*~" -exec rm -f {} ;'
                }
            },
            
            compress: {
                project: {
                    options: {
                      archive: './com_project.zip'
                    },
                    
                    files: [
                      {cwd: 'component/', src: ['**/*'], expand: true, dest: ''},
                    ]
                }
            }
        });
        
        grunt.loadNpmTasks('grunt-exec');
        grunt.loadNpmTasks('grunt-contrib-compress');
        
        grunt.registerTask('default', ['exec', 'compress']);
    };  


I submitted [a pull request](https://github.com/qawemlilo/grunt-exec/commit/2d97c3c71c4f12cb3509c018d55801a92d7ec50e) which has not yet been merged, so for now I am using [my own fork](https://github.com/qawemlilo/grunt-exec/releases/tag/v0.4.3).

If you are using [grunt-exec](https://github.com/jharding/grunt-exec) and you need more control over the output you can replace the [grunt-exec](https://github.com/jharding/grunt-exec) version value in your `package.json` file with the url to [my fork](git+ssh://git@github.com:qawemlilo/grunt-exec.git#v0.4.3) or create your own fork.
    
    ----
        "devDependencies": {
            "grunt": "~0.4.1",
            "grunt-contrib-compress": "~0.5.2",
            "grunt-exec": "git+ssh://git@github.com:qawemlilo/grunt-exec.git#v0.4.3"
        }
    ---

    