'use strict';

function SpotifyLoginController($scope, $interval, $location, Spotify, AuthTokenRefresh) {
  /**
   * Creates a popup window for a user to login and saves the auth token to local storage.
   * This function relies on app/SpotifyConfig.js which is not included in the project repo.
   * Refer to https://github.com/eddiemoore/angular-spotify#usage to configure SpotifyProvider.
   */
  $scope.login = () => {
    Spotify.login()
      .then((data) => {
        AuthTokenRefresh.setAuthToken(data);
        console.log(AuthTokenRefresh.isAuth());

        $interval(function() {
          return Spotify.login()
            .then((data) => {
              console.log(data);
            });
        }, 10000);
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
