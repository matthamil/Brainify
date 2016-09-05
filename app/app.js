'use strict';

let app = angular.module('Brainify', ['ngRoute', 'angularSpinner','spotify']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/landing-page.html',
      controller: 'LoginCtrl'
    })
    .when('/getting-started', {
      templateUrl: 'partials/getting-started.html',
      controller: 'GettingStartedCtrl'
    })
    .when('/test', {
      templateUrl: 'partials/learning-test.html',
      controller: 'LearningCtrl'
    })
    .otherwise('/');
});
