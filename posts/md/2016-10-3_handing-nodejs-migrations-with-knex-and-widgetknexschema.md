Hi guys, it feels great to finally get some time to write my first post for this year - parenting and my day job has kept me quite busy.

Migrations in the Node.js ecosystem is one of those things that still doesn't have an agreed upon go-to solution. Personally, I have been using [Bookshelf.js](http://bookshelfjs.org) as my ORM of choice when dealing with SQL databases. Through [Bookshelk.js](http://bookshelfjs.org) I got introduced to [knex](http://knexjs.org), which is an amazing SQL query builder that comes with migrations. Being the lazy developer that I am means that I'm always looking for ways to get more done with less effort. Node.js' module based system is perfect for that because you can store pieces of reusable code in `npm`. I recently published a module called [widget-knex-schema](https://www.npmjs.com/package/widget-knex-schema) which can be used to easily create database tables through a simple JS/JSON object schema.

To demonstrate how `widget-knex-schema` works, we're going to take code from a previous post, [Building a simple API with Express and Bookshelf.js](http://blog.ragingflame.co.za/2014/12/16/building-a-simple-api-with-express-and-bookshelfjs), and create it's migrations. We'll split the [schema.js](https://github.com/qawemlilo/node-mysql/blob/master/schema.js) file to different files so that each table schema has it's own file and save them in the `db/schemas` directory.


### Dependencies
`widget-knex-schema` at it's best is a `knex` helper therefore we'll need `knex` as a dependency. We'll also use `sqlite` as our database.

`npm i widget-knex-schema knex sqlite3`

Let's not forget to install `knex` globally: `npm i knex -g`

The project we're building on top of also had a few dependencies, let's install those:

`npm i body-parser bookshelf express lodash --save`

In the [Building a simple API with Express and Bookshelf.js](http://blog.ragingflame.co.za/2014/12/16/building-a-simple-api-with-express-and-bookshelfjs) post we had 4 models: User, Post, Category, and Tag. This means we'll need to create 4 tables plus a mapping table for the many-to-many relationship between the posts and tags. Before we can create our migration files we need to initialise `knex` and update the config settings:

`knex init`

Update the created knexfile.js file - we'll store all migration files in `db/migrates` and all schema files in `db/schemas`.

```javascript
"use strict";

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './db.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations',
      directory: __dirname + '/db/migrations'
    }
  }

};

```

With `knex` configured, we're ready to start creating our migrations. Firstly, let's create the users migration file.

```
knex migrate:make creating_users_table
```

Find the file in `db/migrations` and use `widget-knex-schema` to create the users table.

```javascript
"use strict";

const migrate = require('widget-knex-schema');
const usersSchema = require('../schemas/users');


exports.up = function(knex, Promise) {
  return migrate.createTable(knex, 'users', usersSchema, true);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('users');
};
```

Next, let's create the categories migration file.

```
knex migrate:make creating_categories_table
```

```javascript
"use strict";

const migrate = require('widget-knex-schema');
const categoriesSchema = require('../schemas/categories');


exports.up = function(knex, Promise) {
  return migrate.createTable(knex, 'categories', categoriesSchema, true);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('categories');
};
```

Then the tags migration file.

```javascript
knex migrate:make creating_tags_table
```

```javascript
"use strict";

const migrate = require('widget-knex-schema');
const tagsSchema = require('../schemas/tags');


exports.up = function(knex, Promise) {
  return migrate.createTable(knex, 'tags', tagsSchema, true);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('tags');
};
```

Then the posts migration file.

```javascript
knex migrate:make creating_posts_table
```

```javascript
"use strict";

const migrate = require('widget-knex-schema');
const postsSchema = require('../schemas/posts');


exports.up = function(knex, Promise) {
  return migrate.createTable(knex, 'posts', postsSchema, true);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('posts');
};
```

Lastly, create the posts_tags migration file.

```
knex migrate:make creating_posts_tags_table
```

```javascript
"use strict";

const migrate = require('widget-knex-schema');
const postsTagsSchema = require('../schemas/posts_tags');


exports.up = function(knex, Promise) {
  return migrate.createTable(knex, 'posts_tags', postsTagsSchema, true);
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('posts_tags');
};
```

The proof is the pudding - let's run our migrations.

```
knex migrate:latest
```

### Conclusion

This is only the first version of `widget-knex-schema`, I would appreciate some feedback and contributions. In future versions I would like to add more functionality to support column alterations.

All the code in this post can be found on Github: [https://github.com/qawemlilo/handling_migrations](https://github.com/qawemlilo/handling_migrations).

That's all for now - happy coding!
