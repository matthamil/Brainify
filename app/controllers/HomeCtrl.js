'use strict';

/**
 * Home Controller
 * Dependencies: $scope, Spotify (from angular-spotify)
 */
app.controller('HomeCtrl', function($scope, UserPlaylists, Spotify) {
  /**
   * Loads the current user and the user's playlists
   */
  $scope.loadUserInfo = () => {
    UserPlaylists.getUserInfo()
      .then((user) => {
        console.log('User in controller:', user);
        $scope.user = user;
      });
  };
});
