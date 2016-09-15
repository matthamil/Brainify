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
      controller: 'LearningCtrl',
      resolve: {
        network: function (PlaylistsFactory) {
          const playlist = PlaylistsFactory.getSelectedPlaylist();
          const startTime = new Date();
          console.log('Started: Setting up the network at ', startTime);
          return PlaylistsFactory.getNetwork(playlist.id)
            .then((endTime) => {
              const timeDiff = (endTime - startTime)/1000;
              console.info(`Completed setting up the network in ${timeDiff} seconds.`);
            });
        }
      }
    })
    .otherwise('/');

  console.log('$routeProvider configured.');
}

module.exports = AppRoutes;
