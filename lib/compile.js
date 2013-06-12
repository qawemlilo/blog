


var config = require('../config.json'),
    markdown = require('markdown').markdown,
    ejs = require('ejs'),
    fs = require('fs'),
    postsArray = require('../posts.json'),
    sitemap = require('../sitemap'),
    getMonth = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];   



    
/*
    Converts the contents of a Markdown file to html
    
    @param: (String) filename - name of a markdown file
    @returns: html
*/
function mdToHtml (filename, markdown) {
    "use strict";
    
    try {
        var contents = fs.readFileSync(filename, 'utf8'),
            html = markdown.toHTML(contents);
    
        return html;
    }
    catch (error) {
        return '';
    }    
}




/*
    This function returns the object of a single post
    
    @param: (String) filename - name of a post
    @returns: (Object) Post or (Boolean) false
*/
function getPostObject (filename, posts) {
    "use strict";
    
    var i;   

    for (i = 0; i < posts.length; i++) {
        if (posts[i].filename === filename) {
            return posts[i];
        }
    }
    
    return false;
}




/*
    Creates pagination for posts
    
    @param: (Int) counter - loop counter for current post
*/
function pagination (counter, posts) {
    "use strict";
    
    var next = posts[counter + 1], 
        prev = posts[counter - 1], 
        pages = {};   

    if (next) {
        pages.next = next.url;
    }
    else {
        pages.next = false;
    }
    
    if (prev) {
        pages.prev = prev.url;
    }
    else {
        pages.prev = false;
    }
    
    return pages;
}




/*
    Compiles an ejs template to html
    
    @param: (String) template - name an ejs template
    @param: (Object) data - variables for the ejs template
    @returns: (String) html
*/
function compileTemplate(template, data, fs, ejs) {
    "use strict";
    
    var ejsTemplate, compiledHtml;
    
    try {
        ejsTemplate = fs.readFileSync('./template/' + template, 'utf8');
        compiledHtml = ejs.render(ejsTemplate, data);
    
        return compiledHtml;
    }
    catch (error) {
        return '';
    }
}





/*
    Generates the html of a single post
    
    @param: (String) filename - name of a post
    @returns: html
*/
function createPost(filename, post, counter) {
    "use strict";
    
    var postHtmlContent, data, html;
    
    postHtmlContent = mdToHtml('./posts/' + filename + '.md');

    if (!postHtmlContent) {
        return false;
    }    
    
    data = {
        blog: {
            baseUrl: config.blog.baseUrl,
            description: config.blog.description,
            url: config.blog.url,
            rss: config.blog.rss,
            showGithubButton: config.showGithubButton,
            showFacebookButton: config.showFacebookButton,
            showTwitterButton: config.showTwitterButton,
            showGoogleButton: config.showGoogleButton,
            showRssButton: config.showRssButton
            
        },
        
        author: {
            autobio: config.author.autobio,
            email: config.author.email,
            website: config.author.website,
            name: config.author.name,
            rss: config.author.rss,
            githubPage: config.author.githubPage,
            googlePage: config.author.googlePage,
            facbookPage: config.author.facbookPage,
            twitterHandle: config.author.twitterHandle,
            avatar: config.author.avatar
        },
        
        post: {
            title:  post.title,
            description:  post.description,
            year: post.year,
            month: getMonth[post.month],
            day: post.day,
            content: postHtmlContent,
            url: post.url,
            showDate: config.showDate,
            showPagination: config.showPagination,
            showShareButtons: config.showShareButtons
        },
        
        pagination: pagination(counter)
    };
    
    html = compileTemplate('post.ejs', data);
    
    return html;  
}




/*
    Generates html links for all posts and return them in an unordered list
    
    @returns: <ul> html
*/
function createLinks() {
    "use strict";
    
    var links = '<ul class="allposts">', 
        posts;
    
    // let's clone the posts array
    posts = postsArray.slice(0);
    
    // let's get new posts first
    posts.reverse();
    
    posts.forEach(function (post) {
        links += '<li>' + (post.day > 9 ? post.day : '0' + post.day) + ' ' + getMonth[post.month] + ' ' + post.year + ' ';
        links += '<a href="' + post.url + '">' + post.title + '</a>' + '</li>';         
    });
    
    links += '</ul>';

    return links;
};




/*
    Generates the html for the home page

    @returns: html
*/
function createIndex() {
    "use strict";
    
    var html, homeContent, data;
    
    homeContent = createLinks();

    if (!homeContent) {
        return false;
    }    
    
    data = {
        blog: {
            title: config.blog.name,
            baseUrl: config.blog.baseUrl,
            description: config.blog.description,
            rss: config.blog.rss,
            showGithubButton: config.showGithubButton,
            showFacebookButton: config.showFacebookButton,
            showTwitterButton: config.showTwitterButton,
            showGoogleButton: config.showGoogleButton,
            showRssButton: config.showRssButton
        },
        author: {
            autobio: config.author.autobio,
            email: config.author.email,
            website: config.author.website,
            name: config.author.name,
            githubPage: config.author.githubPage,
            googlePage: config.author.googlePage,
            facbookPage: config.author.facbookPage,
            twitterHandle: config.author.twitterHandle,
            avatar: config.author.avatar
        },
        post: {
            content: homeContent
        }
    };
    
    html = compileTemplate('index.ejs', data);
    
    return html;  
}




/*
    First checks if the html file doesn't exist, 
    then checks if the md file has been modified, 
    then writes the file to disk if one of the conditions is true.
    
    @param: (String) filename - name html file to be created
    @param: (HTML String) html - contents of the file
*/
function writeHtmlFile(filename, url, html) {
    "use strict";
    
    if (fs.existsSync('./posts/' + filename + '.html')) {
        var htmlStats = fs.statSync('./posts/' + filename + '.html'),
            mdStats = fs.statSync('./posts/' + filename + '.md'),
            postEjsStats = fs.statSync('./template/post.ejs');
             
        if (mdStats.mtime.getTime() < htmlStats.mtime.getTime() && postEjsStats.mtime.getTime() < htmlStats.mtime.getTime()) {
            sitemap.add({
                url: config.blog.url + url,
                lastmod: htmlStats.mtime.getTime()
            });
            return;
        } 
    }
    
    try {
        fs.writeFileSync('./posts/' + filename + '.html', html, 'utf8');
        sitemap.add({
            url: config.blog.url + url,
            lastmod: htmlStats.mtime.getTime()
        });
        console.log(filename + '.html' + ' created!');
    }
    catch (error) {
        throw error;
    }
}



/*
   Action function
*/
function compile() {
    "use strict";
    
    var i, html;

    if (!postsArray) {
        return;
    }    
       
    try {
        fs.writeFileSync('./posts/index.html', createIndex(), 'utf8');
        sitemap.add({
            url: config.blog.url,
            lastmod: Date.now()
        });
        console.log('Home page created!');    
    }
    catch (error) {
        throw error;
    }
    

    for (i = 0; i < postsArray.length; i++) {
        html = createPost(postsArray[i].filename, i);
        writeHtmlFile(postsArray[i].filename, postsArray[i].url, html);
    }

    sitemap.create();    
}




/*
  Start compiling
*/
compile();