'use strict';

const firebase = require('firebase');

function AppRoutes($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/landing-page.html',
      controller: 'FirebaseLoginCtrl'
    })
    .when('/connect-with-spotify', {
      templateUrl: 'partials/connect-with-spotify.html',
      controller: 'SpotifyLoginCtrl'
    })
    .when('/getting-started', {
      templateUrl: 'partials/getting-started.html',
      controller: 'GettingStartedCtrl',
      resolve: {
        otherUser: function(PlaylistsFactory) {
          // Reset the otherUser every time the user views this route
          PlaylistsFactory.setOtherUser(undefined);
        }
      }
    })
    .when('/messages', {
      templateUrl: 'partials/messages.html',
      controller: 'ViewMessagesCtrl',
      resolve: {
        conversations: function(MessagingFactory) {
          return MessagingFactory.getConversationsForUser(firebase.auth().currentUser.uid);
        }
      }
    })
    .when('/messages/:conversationId', {
      templateUrl: 'partials/conversation.html',
      controller: 'ViewConversationCtrl',
      resolve: {
        conversation: function(MessagingFactory) {
          return MessagingFactory.getSelectedConversation();
        }
      }
    })
    .when('/test-a-playlist', {
      templateUrl: 'partials/learning-test.html',
      controller: 'LearningCtrl',
      resolve: {
        network: function (PlaylistsFactory) {
          const playlist = PlaylistsFactory.getSelectedPlaylist();
          return PlaylistsFactory.getNetwork(playlist.id)
            .then(() => PlaylistsFactory.loadAllOtherNetworks());
        }
      }
    })
    .otherwise('/');

  console.log('$routeProvider configured.');
}

module.exports = AppRoutes;
