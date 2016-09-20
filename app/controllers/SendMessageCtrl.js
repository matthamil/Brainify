'use strict';

const firebase = require('firebase');
const moment = require('moment');

function SendMessageController($scope, $sce, $uibModalInstance, otherUser, song, playlist, score, user, PlaylistsFactory, MessagingFactory, UserSettingsFactory) {
  $scope.otherUser = otherUser;

  $scope.song = song;
  $scope.score = score;

  $scope.messageContent = {
    date: '',
    songid: song.id,
    read: false,
    network_score: score,
    author_id: firebase.auth().currentUser.uid,
    author_name: UserSettingsFactory.getCurrentUser().display_name,
    author_image: UserSettingsFactory.getCurrentUser().image,
    text: '',
  }

  function setPredefinedMessage() {
    if (Math.round(score)) {
      $scope.messageContent.text = `I think ${song.name} by ${song.artists[0].name} would be a great addition to your ${playlist.name} playlist!`;
    } else {
      $scope.messageContent.text = `Even though Brainify gave this song a ${score.toFixed(2)}, I think ${song.name} by ${song.artists[0].name} would be a great addition to your ${playlist.name} playlist!`;
    }
  }

  setPredefinedMessage();

  $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  };

  $scope.send = () => {
    $scope.messageContent.date = moment().format('MMMM Do YYYY, h:mm a');
    const message = {
      users: [
        $scope.otherUser.uid,
        firebase.auth().currentUser.uid
      ],
      messages: [$scope.messageContent]
    };
    console.log('Sending your message!', message);
    console.log(song);
    MessagingFactory.addMessageToChain(message); // always starts new convo
    $uibModalInstance.close();
    $scope.messageContent = {};
  };

  $scope.close = () => {
    $uibModalInstance.close();
    $scope.messageContent = {}
  };
}

module.exports = SendMessageController;
