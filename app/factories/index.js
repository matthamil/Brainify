'use strict';

let angular = require('angular');

angular.module('Brainify').factory('AuthFactory', require('./AuthFactory'));
angular.module('Brainify').factory('UserSettingsFactory', require('./UserSettingsFactory'));
angular.module('Brainify').factory('FirebaseFactory', require('./FirebaseFactory'));
angular.module('Brainify').factory('PlaylistsFactory', require('./PlaylistsFactory'));
angular.module('Brainify').factory('SynapticFactory', require('./SynapticFactory'));
angular.module('Brainify').factory('MessagingFactory', require('./MessagingFactory'));
console.info('Loaded Brainify factories');
