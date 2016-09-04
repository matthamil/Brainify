'use strict';

let app = angular.module('Brainify', ['ngRoute', 'spotify']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/landing-page', {
      templateUrl: 'partials/landing-page.html',
      controller: 'LoginCtrl'
    })
    .otherwise('/landing-page');
});
