'use strict';

let angular = require('angular');

angular.module('Brainify').factory('FirebaseFactory', require('./FirebaseFactory'));
angular.module('Brainify').factory('UserPlaylists', require('./PlaylistFactory'));
angular.module('Brainify').factory('SynapticFactory', require('./SynapticFactory'));
