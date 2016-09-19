'use strict';

function SearchResultUserPlaylistsController($scope, $location, PlaylistsFactory, UserSettingsFactory, Spotify) {
  PlaylistsFactory.getOtherUserInfo()
    .then((otherUser) => {
      $scope.otherUser = otherUser;
    });
}

module.exports = SearchResultUserPlaylistsController;
