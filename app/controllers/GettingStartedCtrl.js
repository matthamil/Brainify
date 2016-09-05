'use strict';

/**
 * Getting Started Controller
 * Dependencies: $scope, $location, UserPlaylists (Factory), Spotify (from angular-spotify)
 */

function GettingStartedController($scope, $location, UserPlaylists, Spotify) {
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
        // If no user is found, redirect to landing page
        console.error(error);
        $location.url('/');
      });
  };

  $scope.setSelectedPlaylist = (playlistId) => {
    UserPlaylists.setSelectedPlaylist(playlistId);
    UserPlaylists.getAudioFeaturesForPlaylist(UserPlaylists.getSelectedPlaylist())
      .then((data) => {
        $location.url('/test');
      });
    // $location.url('/test');
  };

  $scope.test = () => {
    UserPlaylists.getAudioFeaturesForPlaylist(UserPlaylists.getSelectedPlaylist());
  };
}

module.exports = GettingStartedController;
