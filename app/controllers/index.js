'use strict';

let angular = require('angular');

angular.module('Brainify').controller('SpotifyLoginCtrl', require('./SpotifyLoginCtrl'));
angular.module('Brainify').controller('GettingStartedCtrl', require('./GettingStartedCtrl'));
angular.module('Brainify').controller('LearningCtrl', require('./LearningCtrl'));
angular.module('Brainify').controller('FirebaseLoginCtrl', require('./FirebaseLoginCtrl'));
console.info('Loaded Brainify controllers');
