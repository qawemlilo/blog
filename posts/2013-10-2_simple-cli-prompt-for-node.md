> A simple commandline prompt for Node.js

While working on a Node.js automation software I needed to generate some files and code after collecting some information from the user. Most of the modules that I found were a bit of an over-kill, all I wanted was a good old prompt (the browser type) so I decided to write this module. 

### Installation

    npm install simple-prompt

### How to use

Simple prompt accepts an array of `question objects`

    var prompt = require('simple-prompt');

    var questions = [
        {
            question: 'Name',
        
            required: true // required
        },
        {
            question: 'Surname' //optional
        },
        {
            question: 'Age',
        
            required: true, // required
        
            validate: function (answer) {
                return parseInt(answer, 10) >= 18; // only 18 or higher
            },
        
            filter: function (answer) {
                return parseInt(answer, 10); // bring back my answer as a number
            }
        }
    ];
    
    prompt(questions, function (answers) {
        console.log(answers);
    });
    

### Question object
The `question object` has 4 properties that you can specify:

 - question (String)- label for your question and key for your answer.
 - required (Boolean) - flag to indicated if input is required.
 - validate (Function) - a function that accepts a string and returns a boolean value after testing it.
 - filter (Function) - a function that accepts a string and returns it after doing operations on it.
 
 
### Testing
    npm test


[FORK ON GITHUB](https://github.com/qawemlilo/prompt)
