'use strict';

function GettingStartedController($scope, $location, PlaylistsFactory, Spotify) {
  // Boolean to control loading animation
  $scope.showSpinner = true;

  /**
   * Loads the current user and the user's playlists
   */
  $scope.loadUserInfo = () => {
    PlaylistsFactory.getUserInfo()
      .then((user) => {
        $scope.user = user;
        // Disble the loading animation
        $scope.showSpinner = false;
      })
      .catch((error) => {
        // If no user is found, redirect to landing page
        console.error('Error: No Spotify user found', error);
        $location.url('/');
      });
  };

  $scope.setSelectedPlaylist = (playlistId) => {
    PlaylistsFactory.setSelectedPlaylist(playlistId);
    PlaylistsFactory.getAudioFeaturesForPlaylist(PlaylistsFactory.getSelectedPlaylist())
      .then((data) => {
        $location.url('/test');
      });
  };
}

module.exports = GettingStartedController;
