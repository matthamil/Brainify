'use strict';

const firebase = require('firebase');

function SendMessageController($scope, $sce, $uibModalInstance, otherUser, song, playlist, score, user, PlaylistsFactory, MessagingFactory) {
  $scope.otherUser = otherUser;

  $scope.song = song;
  $scope.score = score;

  $scope.message = {
    text: '',
    title: `${$scope.song.name} by ${$scope.song.artists[0].name}`,
    from: firebase.auth().currentUser.uid,
    from_name: user.display_name,
    from_image: user.image,
    to: PlaylistsFactory.getOtherUser().uid,
    to_name: PlaylistsFactory.getOtherUser().display_name,
    to_image: PlaylistsFactory.getOtherUser().image,
    network_score: score,
    read: false,
    date: new Date(),
    songid: song.id
  };

  function setPredefinedMessage() {
    if (Math.round(score)) {
      $scope.message.text = `I think ${song.name} by ${song.artists[0].name} would be a great addition to your ${playlist.name} playlist!`;
    } else {
      $scope.message.text = `Even though Brainify gave this song a ${score.toFixed(2)}, I think ${song.name} by ${song.artists[0].name} would be a great addition to your ${playlist.name} playlist!`;
    }
  }

  setPredefinedMessage();

  $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  };

  $scope.send = () => {
    console.log('Sending your message!', $scope.message);
    console.log(song);
    MessagingFactory.sendMessage($scope.message);
    $uibModalInstance.close();
    $scope.message = {};
  };

  $scope.close = () => {
    $uibModalInstance.close();
    $scope.message = {};
  };
}

module.exports = SendMessageController;
