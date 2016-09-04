'use strict';

let app = angular.module('Brainify', ['spotify', 'ngRoute']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/landing-page.html',
      controller: 'LoginCtrl'
    })
    .otherwise('/');
});
