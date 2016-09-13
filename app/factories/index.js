'use strict';

let angular = require('angular');

angular.module('Brainify').factory('AuthFactory', require('./AuthFactory'));
angular.module('Brainify').factory('FirebaseFactory', require('./FirebaseFactory'));
angular.module('Brainify').factory('PlaylistsFactory', require('./PlaylistFactory'));
angular.module('Brainify').factory('SynapticFactory', require('./SynapticFactory'));
