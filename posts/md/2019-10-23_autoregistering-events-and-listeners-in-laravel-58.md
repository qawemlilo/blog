
*(First published on [Dev.to](https://dev.to/qawemlilo/auto-registering-events-and-listeners-in-laravel-5-8-kkd))*

For the past 4 years I have been working on a `Laravel 4.2` application which I inherited as an MVP. This application has grown over the years and accumulated a lot of technical debt. About a month ago I started refactoring the entire codebase and upgrading it to `Laravel 5.8`. This process has presented a number challenges which have required a pragmatic approach.

In this post I will share with you how to auto-register events and listeners which is useful when handling a large number of events and listeners.

Our application has more than 100 different emails that are triggered by different types of events. In our old set up, all the events were defined in one file and the logic lived in a 'god' Mailer class which was about 4000 lines long. In the upgrade I decided to follow the observer implementation with each event, listener, and mailer having its own class. This approach would help with decoupling and maintenance of the application's mailing logic. Below is an illustration of directory structure in the upgrade:


```
App/
  Events/
    UserRegistered.php
  Listeners/
    HandleUserRegistered.php
  Mail/
    UserRegistered.php
```

### Registering Events & Listeners

Breaking down our Mailer class led to the creation of 100s of files for events, listeners and mailers. When events and listeners have been created, they need to mapped and registered in the `EventServiceProvider`. Manually importing all events and listeners in `EventServiceProvider` quickly became messy as the class got too large making it easy to introduce errors and mix up the pairing of events and listeners.

This problem got me wondering, is there a better way of registering events and listeners without explicitly importing them in the `EventServiceProvider`? I did a bit of googling but no satisfactory results came up. So I decided to write my own solution.

### The Idea
Create a method in the `EventServiceProvider` that does the following:

 1. Searches for all event classes
 2. Finds their corresponding listeners
 3. Pairs and registers them

In order for this idea to work I needed to come up with a predictable naming convention for the events and listeners. This is how I did it: for every event class created, I create a corresponding listener which adds `Handle` as a prefix to the event class name. For example, if I have an event called `UserRegistered`, the corresponding listener class would be named `HandleUserRegistered`.

### The solution

Below is the new implementation of the `EventServiceProvider`.

```
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;


class EventServiceProvider extends ServiceProvider
{
  protected $listen = [];


  public function boot()
  {
      parent::boot();

      $this->registerEventsAndListeners();
  }


  protected function registerEventsAndListeners()
  {
    $eventsDir = app_path('Events');

    foreach (glob("$eventsDir/*.php") as $filename) {
      $eventClassName = basename($filename, ".php");

      Event::listen('App\Events\\' . $eventClassName, 'App\Listeners\Handle' . $eventClassName);
    }
  }
}
```

Now I have a clean and minimal `EventServiceProvider` plus I don't have to worry about registering events and listeners that I create in future.

Let me know what you think. Do you have any interesting solutions for this problem?
