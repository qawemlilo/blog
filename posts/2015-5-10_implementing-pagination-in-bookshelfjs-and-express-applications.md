Hi there my node curious friends. Today I would like to look at one of the most common components in application development, pagination. Almost every database driven application that you build requires some kind of pagination functionality.

If you have read some of my [previous posts](http://blog.ragingflame.co.za/2014/12/16/building-a-simple-api-with-express-and-bookshelfjs), you would have noticed how fond I am of Bookshelf.js. In this post, I am going to show you how to implement pagination using Bookshelf.js, Express, and Jade. We are going to take code used in a previous post, [Building a simple API with Express and Bookshelf.js](http://blog.ragingflame.co.za/2014/12/16/building-a-simple-api-with-express-and-bookshelfjs), modify it to be more modular, and then implement today's solution.

### Getting started

This is how I am going to approach today's problem:

  1. Clone the repo from the aforementioned post: `git clone git@github.com:qawemlilo/node-mysql.git pagination`
  2. Break it down into an mvc-like modular architecture
  3. Install view engines, jade
  4. Create a base collection with pagination and other collections which extend the base collection
  5. Create some controllers for loading views
  6. Create a seeding script to populate the database with some random data

### Creating Pagination

The best way to implement pagination is to have a base collection that will be extended by other collections. This will ensure that all the collections we create will have pagination therefore enforcing DRY principles.

Before going any further, let us define what we want in our pagination:

  1. We need to have control over how many records are returned per query
  2. We need to have the ability to sort the data by any column
  3. We need to be able to create queries with multiple conditions
  4. Easy view implementation - we should be able easily render the pagination in our views

It is also important to note that we do not want to override any functionality of the Bookshelf Collection API - if someone used our collection without the full knowledge of pagination, everything should still work as expected.

Enough with the chit-chat, let's write some code.

**collections/base.js**

    "use strict";
    
    var Bookshelf = require('../dbconnect')();
 
    Bookshelf.Collection = Bookshelf.Collection.extend({
    
      limit: 10,
    
      currentpage: 1,  

      pagination: {},

      base: '',

      paginationLimit: 10,
    
      queries: [],

      order: 'desc',

      /**
       * generates pagination data
       * @returns: {Object} - pagination data object
      */
      generatePagination: function (totalRecords) {
        var self = this;
        var totalpages = Math.ceil(totalRecords / self.limit);
        var groups = Math.ceil(totalpages / self.paginationLimit);
        var currentpage = self.currentpage;
        var items = [];
        var lastpage = totalpages;
    
        var next = currentpage < lastpage ? currentpage + 1 : 1;
        var prev = currentpage < 2 ? lastpage : currentpage - 1;
    
        var isFirstPage = currentpage === 1;
        var isLastPage = currentpage === lastpage;
    
        var highestF = currentpage + 2;
        var lowestF = currentpage - 2;
        var counterLimit = totalpages - 2;
    
        if (groups > 1) {
          items.push(1);
          items.push(2);
          
          // if our current page is higher than 3
          if (lowestF > 3) {
            items.push('...');
    
            //lets check if we our current page is towards the end
            if (lastpage - currentpage < 2) {
               lowestF -=  3; // add more previous links       
            }
          }
          else {
            lowestF = 3; // lowest num to start looping from
          }
    
          for (var counter = lowestF; counter < lowestF + 5; counter++) {
            if (counter > counterLimit) {
              break;
            }
    
            items.push(counter);
          }
            
          // if current page not towards the end
          if (highestF < totalpages - 2) {
            items.push('...');
          }
    
          items.push(lastpage - 1);
          items.push(lastpage);
        }
        else {
          // no complex pagination required
          for (var counter2 = 1; counter2 <= lastpage; counter2++) {
            items.push(counter2);
          }
        }
       
        self.pagination = {
          items: items,
          currentpage: currentpage,
          base: self.base,
          isFirstPage: isFirstPage,
          isLastPage: isLastPage,
          next: next,
          prev: prev,
          total: totalRecords,
          limit: self.limit
        };
    
        return self.pagination;
      },
   

      /**
       * Creates pagination data
       * @returns: {Promise} - resolves with pagination object
      */
      paginate: function () {
        var self = this;
        var query = self.model.forge().query();
        var totalpages = 0;
    
        if (self.queries.length > 1) {
          self.queries.forEach(function (where, i) {
            if (i === 0) {
              query.where(where[0], where[1], where[2]);
            }
            else {
              query.andWhere(where[0], where[1], where[2]);
            }
          });
        }
        
        return query.count('id AS total')
        .then(function (results) {
          totalpages = parseInt(results[0].total, 10);
    
          return self.generatePagination(totalpages);
        });
      },
      
      /**
       * fetches posts ordered by {sortColumn} and creates pagination
       * @returns: {Promise} - resolves with an Object
      */
      fetchBy: function (sortColumn, options, fetchOptions) {
        
        options = options || {};
        fetchOptions = fetchOptions || {};
    
        var self = this;
        var limit = parseInt(options.limit, 10) || self.limit;
        var currentpage = parseInt(options.page, 10) || self.currentpage;
        var order = options.order || self.order;
    
        self.queries = options.where || [];
    
        self.currentpage = currentpage;
        self.limit = limit;
        self.order = order;
        self.base = options.base || '';
        
        function fetch() {
          return self.constructor.forge()
          .query(function (query) {
            query.limit(limit);
            
            self.queries.forEach(function (where, i) {
              if (i === 0) {
                query.where(where[0], where[1], where[2]);
              }
              else {
                query.andWhere(where[0], where[1], where[2]);
              }
            });
    
            query.offset((currentpage - 1) * limit);
            query.orderBy(sortColumn, order);
          })
          .fetch(fetchOptions)
          .then(function (collection) {
            return {
              collection: collection,
              pagination: self.pagination
            };
          });
        }
    
        return self.paginate().then(fetch);
      }
    });
    
    module.exports = Bookshelf;


This is the base collection and below is an example of how it is extended:

**collections/posts.js**

    var Base = require('./base');
    var Post = require('./models/post');
   
    var Posts = Base.Collection.extend({
      model: Post
    });
   
    module.exports = Posts;


Whenever we want to fetch a paginated set of data we'll use the `.fetchBy` method. This method accepts 3 arguments:

  1. The first argument is the name of the sorting column
  2. The second argument is an object with pagination options.
  3. The last argument is an options object typically passed to the `fetch` method

I have created a controller that handles pagination:

**controllers/posts.js**

    var Posts = require('../collections/posts');

    module.exports.getPosts = function (req, res) {
      var posts = new Posts();
      var page = parseInt(req.query.p, 10);
      var limit = parseInt(req.query.limit, 10) || 10;
      var currentpage = page || 1;
      var order = req.query.order || "asc";

      posts.fetchBy('published_at', {
        page: currentpage,
        limit: limit,
        order: order,
        where: [
          ['user_id', '=', 1],
          ['category_id', '=', 3]
        ]
      },
      {
        columns: ['id', 'slug', 'html', 'title'],
        withRelated: ['category']
      })
      .then(function (data) {
        res.render('posts', {
          pagination: data.pagination,
          posts: data.collection.toJSON()
        });
      })
      .otherwise(function (error) {
        res.status(500).send(error.message);
      });
    };

All that is left now is to associate the `.getPosts` method with a route of your choice and create a `posts.jade` view.

In the spirit of the DRY principle I am going to create a jade mixin that accepts the pagination object and generates the pagination html. Its always a good idea to have a `mixins` directory inside your views directory.

**views/mixins/pagination.js**

    mixin paginate(pagination)
      if pagination.limit < pagination.total
        .row(style='text-align: center')
          ul.pagination
            if (pagination.isFirstPage)
              li.disabled
                a(href='#') &laquo; Prev
       
            else
              li
                a(href='?p=#{pagination.prev}') &laquo; Prev
       
            each page, i in pagination.items
              if (page == '...')
                li.disabled
                  a(href="#") ...
        
              else
                if (page == pagination.currentpage)
                  li.active
                    a(href='#{pagination.base}?p=#{page}') #{page}
                else
                  li
                    a(href='#{pagination.base}?p=#{page}') #{page}
       
            if (pagination.isLastPage)
              li.disabled
                a(href='#') Next &raquo;
       
            else
              li
                a(href='#{pagination.base}?p=#{pagination.next}') Next &raquo;
      

Below is an example of how you would use the mixin inside a jade view:

**views/posts.jade**


    extends layout
   
    include mixins/pagination
   
    block content
      div(class="col-sm-8 blog-main")
        each post, i in posts
          dl.dl-horizontal
            dt #{post.created_at}
            dd
              a(href="/posts/#{post.slug}") #{post.title}
   
        mixin paginate(pagination)
   

I have created a repo, [https://github.com/qawemlilo/pagination](https://github.com/qawemlilo/pagination), with a fully functional demo. This is how you can run it:

  1. Clone the repo: `git clone https://github.com/qawemlilo/pagination.git`
  2. Cd into the directory and install dependencies: `npm install`
  3. Update `config.js` with your db details
  4. Create db tables and insert random data: `node migrate && node seed`
  5. Start the server: `node app`

That's all folks! Please [share on twitter](http://twitter.com/home?status=Implementing%20Pagination%20in%20%23Bookshelfjs%20and%20%23Express%20applications%20http%3A%2F%2Fblog.ragingflame.co.za%2F2015%2F5%2F10%2Fimplementing-pagination-in-bookshelfjs-and-express-applications%20%23nodejs%20%40ragingflameblog) if you enjoyed this post :)





