'use strict';

let app = angular.module('Brainify', ['ngRoute', 'angularSpinner','spotify']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/landing-page.html',
      controller: 'LoginCtrl'
    })
    .when ('/home', {
      templateUrl: 'partials/home.html',
      controller: 'HomeCtrl'
    })
    .otherwise('/');
});
