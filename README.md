# State Builder for the [AngularUI Router](https://github.com/angular-ui/ui-router)

Have you ever been confused about how to build state hierarchies in AngularUI Router?
With this module, you can specify your states as chains (some magic is involved).

## Example

```javascript
angular.module('app').config(function ($stateBuilderProvider) {
  'use strict';

  var resolveSession = ['session', function (session) {
    return session.init();
  }];

  $stateBuilderProvider

  // main state
  .state('main').url('').abstract().resolve('session', resolveSession)
    .state('home').done()
    .state('about').done()
  .done()

  // user state
  .state('user').abstract()
    .state('profile').done()
    .state('friends').abstract()
      .state('list').url('').done()
      .state('show').url('/:id').done()
    .done()
  .done();

});
```

The resulting states are:

```json
{
  "app": {
    "url": "",
    "abstract": true,
    "controller": "app",
    "templateUrl": "app/states/app.html",
    "resolve": {}
  },
  "app.home": {
    "url": "/home",
    "controller": "app.home",
    "templateUrl": "app/states/app.home.html"
  },
  "app.about": {
    "url": "/about",
    "controller": "app.about",
    "templateUrl": "app/states/app.about.html"
  },
  "user": {
    "abstract": true,
    "url": "/user",
    "controller": "user",
    "templateUrl": "app/states/user.html"
  },
  "user.profile": {
    "url": "/profile",
    "controller": "user.profile",
    "templateUrl": "app/states/user.profile.html"
  },
  "user.friends": {
    "abstract": true,
    "url": "/friends",
    "controller": "user.friends",
    "templateUrl": "app/states/user.friends.html"
  },
  "user.friends.list": {
    "url": "",
    "controller": "user.friends.list",
    "templateUrl": "app/states/user.friends.list.html"
  },
  "user.friends.show": {
    "url": "/:id",
    "controller": "user.friends.show",
    "templateUrl": "app/states/user.friends.show.html"
  }
}
```

## The Magic

The state builder can automatically derive a state's url, controller, and templateUrl. The default logic is:

* `url`: state name prefixed with a slash (`"/home"`)
* `controller`: the full state name (`"app.home"`)
* `templateUrl`: an html file with the full state name in your templates folder (`"app/states/app.home.html"`)

This logic can be customized via the `config` method:

```javascript
$stateBuilderProvider
.config('url', function (state) { return '/' + state.path[state.path.length - 1]; })
.config('templateUrl', function (state) { return config.templatePath + state.path.join('.') + '.html'; })
.config('controller', function (state) { return state.path.join('.'); });
```

The `state` object has the following keys:

* `path`: the state's name path as an array
* `name`: state state's name
* `options`: any previously set state options

To disable any part of this logic, assign `false` to the appropriate config setting:

```javascript
$stateBuilderProvider
.config('controller', false);
```

The `templateUrl` magic uses the `templatePath` config setting to determine its result, allowing you to specify a custom path:

```javascript
$stateBuilderProvider
.config('templatePath', 'app/templates/');
```

Do not forget the slash at the end!

## State Creation

Create a state by invoking the `state` method with the name of the state:

```javascript
$stateBuilderProvider
.state('main')
```

Creating a state will always create a substate to the previously defined state:

```javascript
$stateBuilderProvider
.state('a')
.state('b')
.state('c')
```

Above example will create 3 states: `a`, `a.b`, and `a.b.c`.

To stop creating substates for a given state, use the `done` method:

```javascript
$stateBuilderProvider
.state('a').done()
.state('b').done()
.state('c').done()
```

Tip: `leaf()` is a short for `.state().done()`.

A state is configured by calling additional methods after its creation:

```javascript
$stateBuilderProvider
.state('user')
.url('/user/:id')
.controller('UserController')
.templateUrl('app/user.html')
```

The available configuration methods are:

* `template`: the template (function or string)
* `templateUrl`: the template url (function or string)
* `templateProvider`: the template provider
* `controller`: the controller (function or string)
* `controllerProvider`: the controller provider
* `controllerAs`: the controller name (string)
* `url`: the url (function or string)
* `onEnter`: enter-function (function)
* `onExit`: exit-function (function)
* `abstract`: create an abstract state (boolean)
* `reloadOnSearch`: reload the state on search (boolean)
* `data`: specify custom data (object)
* `resolve`: resolve dependencies (name, function)
* `views`: specify a view (name, object)
* `params`: specify a parameter (name, object)
* `default`: make this the overall default state
* `defaultChild`: make this the default child state

The methods `resolve`, `views`, and `params` can be called multiple times.
They accept two paramers: the name of the thing to be specified and the specification.

```javascript
$stateBuilderProvider
.state('user')
.url('/user/:id')
.params('id', -1)
.views('avatar', { templateUrl: 'templates/avatar.html' })
.views('form', { templateUrl: 'templates/form.html' })
```

The methods `default` and `defaultChild` create redirect rules according to the `$urlRouterProvider`.

```javascript
$stateBuilderProvider
.state('main').default().done()
.state('user').abstract()
  .state('profile').defaultChild().done()
  .state('details').done()
.done()
```

Above example creates two redirection rules:

```javascript
$urlRouterProvider.otherwise('/main');
$urlRouterProvider.when('/user', '/user/profile');
```
