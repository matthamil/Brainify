'use strict';

app.controller('LearningCtrl', function($scope, SynapticFactory, UserPlaylists) {
  $scope.user = UserPlaylists.user;

  $scope.playlist = UserPlaylists.getSelectedPlaylist();


});
