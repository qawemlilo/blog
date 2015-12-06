About 2 years ago, after getting frustrated with the bloat in WordPress, I decided to roll out my own static blog generator. That static blog generator, named [Node Blogger](), still powers my blog today. In this post I would like to share with you how I built it and how it works.

The idea that I had was that I would write a post in a markdown file, convert it to a html file, then serve the html file through a Node.js web server.
To get started I listed all my requirements:

  1. Home page with my profile, a main menu, social media menu, and a list of all my posts ordered by date.
  2. RSS feed
  3. Sitemap
  4. Tags filter
  5. Social media sharing buttons
  6. SEO friendly urls
  7. Good meta tags (title, description, and keywords)
  8. Social media sharing buttons
  9. Comments
  10. Fast, clean, easy to maintain, and fun to work with

With this information in hand I started doing some research which led me to come up with the following algorithm:

  1. Create a record of a new post that contains time of creation, title and other metadata and save it
  2. Generate a markdown file associated the record
  3. Write your post in the markdown file
  4. Generate a html file from the markdown file and update your blog links in the index file
  5. Generate sitemap by reading posts records
  7. For RSS, create a script that converts posts records to RSS xml and serve it through a route
  8. Spin up a web server that serves the files and your blog is complete.


### Running commands
From the onset I decided that everything would run from the terminal because of its simple interface which meant I would not spend a lot of time designing the UI.

For capturing data I wrote a small module called [simple-prompt](https://www.npmjs.com/package/simple-prompt) which is a simplified commandline prompt.


### Storing records
Since this was going to be a static blog generator the best place to store data was in a json file. `posts.json` became the pseudo database. The script that generates html files loops through `posts.json` to find the corresponding markdown files. It is also used determine the order of posts.

I recently added a dynamic tags filter which reads `posts.json` and only brings up posts that contain the filtered tag.


### Converting markdown files to html
I used a module called `markdown` to convert the markdown posts to html. The process is pretty simple - the `posts.json` file contains metadata for each post including the markdown file path. Once I have opened the markdown file I convert the contents to html using the `markdown` module and load them into the `post.ejs` template. The EJS template is then converted to html and saved as a html file.


### Index and Post EJS templates
The blog required 2 templates, one for the index page and the other for the posts page. I decided to write the templates in EJS because of its simplicity.

The index templates outputs generic blog content and links for all posts ordered by date. The post template also outputs the generic blog content and the post content which included social sharing buttons and a Disqus comments script.


### Sitemap and RSS
The idea for the sitemap was that it would be created/updated every time a new post was created. So every time the command for creating html files is run it also executes the sitemap script which reads the `posts.json` file to get records of all posts and then convert them into a sitemap.

### RSS
Like the sitemap script, the rss script reads the `posts.json` file to get records of all posts. The records are then converted into xml feed format and served through a connect route. The script use the `rss` module.

### Serving the blog
Finally, all that was left was to create a web server that serves my html files. For the first version I used the `native node http module` but later switched to `connect` because it handles routing better and has a number of useful middleware modules.

### Last words
My blog is hosted on Heroku, I'm using their free tier which provides 5 free Dynos. I'm a much happier blogger now that I have moved away from WordPress - I get to hack on blogging engine wherever I am not writing. 

My blogging engine is opensource so feel free to [fork it]() and do whatever you want with it. The documentation is a bit out of date but will update when I get some free time.

Keep hacking and blogging :)