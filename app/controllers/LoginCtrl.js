'use strict';

app.controller('LoginCtrl', function($scope, Spotify) {
  /**
   * Creates a popup window for a user to login and saves the auth token to local storage
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
