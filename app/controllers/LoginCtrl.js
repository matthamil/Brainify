'use strict';

app.controller('LoginCtrl', function($scope, Spotify) {
  $scope.login = () => {
    Spotify.login();
  };

  $scope.userTest = () => {
    Spotify.getCurrentUser().then((data) => {
      console.log(data);
    });
  };

  $scope.audioFeatureTest = () => {
    Spotify.getTrackAudioFeatures('0eGsygTp906u18L0Oimnem').then(function (data) {
      console.log(data);
    });
  };
});
