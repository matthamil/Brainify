'use strict';

/**
 * Login Controller
 * Dependencies: $scope, Spotify (from angular-spotify)
 */
app.controller('LoginCtrl', function($scope, Spotify) {
  /**
   * Creates a popup window for a user to login and saves the auth token to local storage.
   * This function relies on app/SpotifyConfig.js which is not included in the project repo.
   * Refer to https://github.com/eddiemoore/angular-spotify#usage to configure SpotifyProvider.
   */
  $scope.login = () => {
    Spotify.login();
  };

  /**
   * Logs the current user information to the console
   */
  $scope.userTest = () => {
    Spotify.getCurrentUser().then((data) => {
      console.log(data);
    });
  };

  /**
   * Logs the audio features for the test song
   */
  $scope.audioFeatureTest = () => {
    Spotify.getTrackAudioFeatures('0eGsygTp906u18L0Oimnem').then(function (data) {
      console.log(data);
    });
  };
});
