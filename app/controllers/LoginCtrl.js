'use strict';

/**
 * Login Controller
 * Dependencies: $scope, $location, Spotify (from angular-spotify)
 */
app.controller('LoginCtrl', function($scope, $location, Spotify) {
  /**
   * Creates a popup window for a user to login and saves the auth token to local storage.
   * This function relies on app/SpotifyConfig.js which is not included in the project repo.
   * Refer to https://github.com/eddiemoore/angular-spotify#usage to configure SpotifyProvider.
   */
  $scope.login = () => {
    Spotify.login()
      .then((data) => {
        // Reroute the user once logged in
        $location.url('/home');
      })
      .catch((error) => {
        // If the user closes the login popup, redirect to landing page
        $location.url('/');
      });
  };
});
