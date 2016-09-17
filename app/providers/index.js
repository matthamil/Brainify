'use strict';

let angular = require('angular');

angular.module('Brainify').provider('AuthTokenRefresh', require('./AuthTokenRefresh'));
console.info('Loaded Brainify providers');
