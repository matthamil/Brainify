'use strict';

function AppRoutes($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/landing-page.html',
      controller: 'FirebaseLoginCtrl'
    })
    .when('/connect-with-spotify', {
      templateUrl: 'partials/connect-with-spotify.html',
      controller: 'SpotifyLoginCtrl'
    })
    .when('/getting-started', {
      templateUrl: 'partials/getting-started.html',
      controller: 'GettingStartedCtrl',
    })
    .when('/settings', {
      templateUrl: 'partials/user-settings.html',
      controller: 'UserSettingsCtrl',
      resolve: {
        user: function (UserSettingsFactory) {
          return UserSettingsFactory.getCurrentUser();
        }
      }
    })
    .when('/test', {
      templateUrl: 'partials/learning-test.html',
      controller: 'LearningCtrl'
    })
    .otherwise('/');

  console.log('$routeProvider configured.');
}

module.exports = AppRoutes;
