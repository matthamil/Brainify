'use strict';

function LearningController($scope, SynapticFactory, UserPlaylists) {
  $scope.user = UserPlaylists.user;

  $scope.playlist = UserPlaylists.getSelectedPlaylist();
}

module.exports = LearningController;
