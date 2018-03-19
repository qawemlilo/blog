
### Motivation

You are a busy guy/girl, you have a regular 9 to 5 job and a demanding family life. You have a few side projects that each have their own Twitter account. Balancing your busy life and   keeping your audiences engaged is an almost impossible task. Then it hits you! We're living in the automation era, why work hard when a robot can do all the work for you?

Like you, I have a few side projects with Twitter accounts that I don't always have time to create content for.

Today we're going to build a bot for [NodeZA](https://nodeza.co.za), a social platform for Node.js developers in South Africa. Our bot is going to use the Github API to post the latest package releases for Node and Express (we could add more if we like).

### Requirements

This project requires 3 external node.js modules:

  1. `twit` - a Twitter API client
  2. `axios` - http client (you can replace it with `request` if you like)
  3. `moment` - date/time operations


I am using the latest Node LTS version - v8.9.4.

### Getting started

Create your project folder and init npm:

```

mkdir twitbot && npm init

```


Next install your dependencies:

```
npm install twit axios moment --save
```


Once your modules have been installed, you need to go to Twitter Apps and create a new app. Create a new file, `.env.js`, where you'll store your API Keys:

```javascript

module.exports = {
  TWITTER_BOT_KEY: '',
  TWITTER_BOT_SECRET: '',
  TWITTER_BOT_TOKEN_KEY: '',
  TWITTER_BOT_TOKEN_SECRET: '',
};

```


### The main program: bot.js

Now we're ready to write the main program, this is how it's going to work:

  1. Fetch a repo's releases through Github API using `axios`.
  2. Use `moment` to determine how long ago each release was published, if it's within the last 24 hours, tweet the release using the `twit` module.


```

"use strict";

const Twitter = require('twit');
const axios = require('axios');
const moment = require('moment');
const config = require('./.env');


const client = new Twitter({
  consumer_key: config.TWITTER_BOT_KEY,
  consumer_secret: config.TWITTER_BOT_SECRET,
  access_token: config.TWITTER_BOT_TOKEN_KEY,
  access_token_secret: config.TWITTER_BOT_TOKEN_SECRET
});


console.log();
console.log(' > Checking for new packages releases');
console.log();


async function findAndTweetNewReleases(name, url) {
  try {
    let res = await axios.get(url);
    let releases = res.data;

    if (releases && releases.length) {
      releases.forEach(function (release) {
        let hoursAgo = moment().diff(moment(release.published_at), 'hours');

        if (hoursAgo < 24) {
        let tweet = `New #${name} release: ${release.tag_name} - ${release.html_url}`;

          tweeterClient.post('statuses/update', { status: tweet }, function(err, data, response) {
            if (error) {
              console.error(error)
            }
          });
        }
      });
    }
  }
  catch (error) {
    console.error(error);
  }
}


// nodejs
findAndTweetNewReleases('nodejs', 'https://api.github.com/repos/nodejs/node/releases');

// express
findAndTweetNewReleases('express', 'https://api.github.com/repos/expressjs/express/releases');

// add your own....

```


### Running the bot

The bot will run as a cronjob once a day at 9am.

```

0  9  *  *  *    /usr/bin/env node /var/www/staging.nodeza.co.za/bots/tweet-package-releases.js

```


That's all folks, you're now on your way to building your own Skynet that'll one day take over the world.

Happy hacking!

P.S. "I'll Be Back".
