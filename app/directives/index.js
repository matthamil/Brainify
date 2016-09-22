'use strict';

let angular = require('angular');

angular.module('Brainify').directive('onClickAndHold', require('./ClickAndHoldDirective'));

console.info('Loaded Brainify directives');
