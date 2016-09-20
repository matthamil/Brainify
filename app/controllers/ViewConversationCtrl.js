'use strict';

const firebase = require('firebase');
const moment = require('moment');

function ViewConversationController($scope, $location, conversation, MessagingFactory, UserSettingsFactory) {
  $scope.conversation = conversation;

  const DATABASEREF = firebase.database().ref('conversations');

  DATABASEREF.on('value', (snapshot) => {
    console.log('****** LOOK:', snapshot.val());
    const key = Object.keys(snapshot.val());
    const convo = snapshot.val()[key];
    $scope.conversation = convo;
    $scope.$apply();
  });

  $scope.currentUserUid = firebase.auth().currentUser.uid;

  $scope.sendNewMessage = (e) => {
    if (e.keyCode === 13) {
      console.log(e);
      console.log($scope.newMessage);
      const messageObj = {
        author_id: firebase.auth().currentUser.uid,
        author_image: UserSettingsFactory.getCurrentUser().image,
        author_name: UserSettingsFactory.getCurrentUser().display_name,
        date: moment().format('MMMM Do YYYY, h:mm a'),
        read: false,
        text: $scope.newMessage
      }
      conversation.messages.push(messageObj);
      const updatedConversation = Object.assign({}, conversation);
      updatedConversation.messages = [messageObj];
      $scope.newMessage = '';
      return MessagingFactory.addMessageToChain(updatedConversation);
    }
  };
}

module.exports = ViewConversationController;
