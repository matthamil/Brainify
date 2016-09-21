'use strict';

function ViewMessagesController($scope, $location, MessagingFactory, conversations) {
  console.log('in the controller:', conversations);
  $scope.conversations = conversations;

  $scope.deleteConversation = (conversation) => {
    return MessagingFactory.deleteConversation(conversation)
      .then(() => MessagingFactory.getConversationsForUser(firebase.auth().currentUser.uid))
      .then((conversations) => {
        $scope.conversations = conversations;
      });
  };

  $scope.goToConversation = (conversation) => {
    MessagingFactory.setSelectedConversation(conversation);
    $location.url(`/messages/${conversation.fbKey}`);
  };
}

module.exports = ViewMessagesController;
