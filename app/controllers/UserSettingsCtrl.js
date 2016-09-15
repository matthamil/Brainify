'use strict';

function UserSettingsController($scope, PlaylistsFactory, UserSettingsFactory, user, Spotify) {
  $scope.user = user;

  $scope.spotifyUser = PlaylistsFactory.getSpotifyUser();
  console.log('Spotify user object:', $scope.spotifyUser);

  // Update user profile in Firebase when the current user changes
  $scope.$watch('user', function handleAccountSettingsUpdate(newValue, oldValue) {
    if (newValue !== oldValue) {
      UserSettingsFactory.modifyExistingUser($scope.user);
    }
  }, true);

}

module.exports = UserSettingsController;
