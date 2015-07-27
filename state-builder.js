/*global console */
angular.module('ui.router.builder', ['ui.router'])
.provider('$stateBuilder', function ($stateProvider, $urlRouterProvider) {
  'use strict';

  var self = this;

  function getUrl(state) {
    if (!state) return '';
    var url = (state.options && state.options.url || '');
    if (state.parent) url = getUrl(state.parent) + url;
    return url;
  }

  var config = {
    debug: false,
    templatePath: 'app/states/',
    url: function (state) { return '/' + state.path[state.path.length - 1]; },
    templateUrl: function (state) { return config.templatePath + state.path.join('.') + '.html'; },
    controller: function (state) { return state.path.join('.'); }
  };

  var stateProperties = ['template', 'templateUrl', 'templateProvider',
    'controller', 'controllerProvider', 'controllerAs',
    'url', 'onEnter', 'onExit', 'reloadOnSearch', 'data'];
  var stateMapProperties = ['resolve', 'views', 'params'];

  function stateBuilder(state) {

    function set(key, defaultValue) {
      return function (value) {
        state.options[key] = value === undefined ? defaultValue : value;
        return context;
      };
    }

    function setMap(key) {
      return function (k, v) {
        state.options[key] = state.options[key] || {};
        state.options[key][k] = v;
        return context;
      };
    }

    function generateOption(key) {
      if (state.options[key] === undefined && config[key]) state.options[key] = config[key](state);
    }

    function save() {
      if (!state || state.savedState) return;
      if (!state.path) throw 'State must have a name.';
      var fullName = state.path.join('.');

      // generate options
      generateOption('url');
      if (!state.options.controllerProvider) generateOption('controller');
      if (!state.options.template && !state.options.templateProvider) generateOption('templateUrl');

      // create the state
      state.savedState = $stateProvider.state(fullName, state.options);

      // debug logging
      if (config.debug) console.debug('Create state:', fullName, state.options);
    }

    function setName(name) {
      if (name) {
        state.name = name;
        state.path = (state.parent && state.parent.path || []).concat(name);
      }
      return context;
    }

    function setOptions(options) {
      state.options = options || {};
      return context;
    }

    function createSubState(name, options) {
      save();
      return stateBuilder({ parent: state }).name(name).options(options);
    }

    function done() {
      if (!state) throw 'Cannot call done() on root state.';
      save();
      return stateBuilder(state.parent);
    }

    function leaf(name, options) {
      return createSubState(name, options).done();
    }

    function makeDefault() {
      save();
      var url = getUrl(state);

      if (config.debug) console.debug('Redirect:', '->', url);

      $urlRouterProvider.otherwise(url);
      return context;
    }

    function makeDefaultChild() {
      save();
      var parentUrl = getUrl(state.parent);
      var url = parentUrl + state.options.url;

      if (config.debug) console.debug('Redirect:', parentUrl, '->', url);

      $urlRouterProvider.when(parentUrl, url);
      return context;
    }

    var context = {
      state: createSubState,
      done: done,
      leaf: leaf,
      default: makeDefault,
      defaultChild: makeDefaultChild,
      name: setName,
      options: setOptions,
      abstract: set('abstract', true)
    };
    stateProperties.forEach(function (key) { context[key] = set(key); });
    stateMapProperties.forEach(function (key) { context[key] = setMap(key); });

    return context;
  }

  // initialize config
  function setConfig(key, value) {
    config[key] = value;
    return self;
  }

  this.$get = function () {};
  this.config = setConfig;
  this.state = function (name, options) {
    return stateBuilder().state(name, options);
  };
});
