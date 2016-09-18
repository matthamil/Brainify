'use strict';

function SpotifyLoginController($scope, $interval, $location, Spotify) {
  /**
   * Creates a popup window for a user to login and saves the auth token to local storage.
   * This function relies on app/SpotifyConfig.js which is not included in the project repo.
   * Refer to https://github.com/eddiemoore/angular-spotify#usage to configure SpotifyProvider.
   */
  $scope.login = () => {
    Spotify.login()
      .then((data) => {
        // Refresh Spotify auth every 3 minutes
        $interval(function() {
          console.log('Refreshing Spotify token!');
          localStorage.removeItem('spotify-token');
          Spotify.login();
        }, (3 * 60 * 1000)); //3 * 60 * 1000

        // Reroute the user once logged in
        $location.url('/getting-started');
      })
      .catch((error) => {
        // If the user closes the login popup, redirect to Connect with Spotify page
        $location.url('/connect-with-spotify');
      });
  };
}

module.exports = SpotifyLoginController;
