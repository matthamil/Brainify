'use strict';

/**
 * Home Controller
 * Dependencies: $scope, $location, UserPlaylists (Factory), Spotify (from angular-spotify)
 */
app.controller('HomeCtrl', function($scope, $location, UserPlaylists, Spotify) {
  // Boolean to control loading animation
  $scope.showSpinner = true;

  /**
   * Loads the current user and the user's playlists
   */
  $scope.loadUserInfo = () => {
    UserPlaylists.getUserInfo()
      .then((user) => {
        console.log('User in controller:', user);
        $scope.user = user;
        // Disble the loading animation
        $scope.showSpinner = false;
      })
      .catch((error) => {
        console.error(error);
        $location.url('/');
      });
  };
});
