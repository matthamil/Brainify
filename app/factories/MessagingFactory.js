'use strict';

function MessagingFactory($q, $http, UserSettingsFactory) {
  function addMessageToChain(messageObj) {
    const conversationId = findConversationId(messageObj.to, messageObj.from);
    return $q((resolve, reject) => {
      $http.post(`https://brainify-ddc05.firebaseio.com/conversations/${conversationId}/messages.json`, angular.toJson(messageObj.messages))
        .success((response) => {
          console.log('Success! Added new message to chain:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to add new message to chain:', error);
          reject(error);
        });
    });
  }

  function deleteMessageFromChain() {
    // TODO
  }

  function findConversationId(currentUser, otherUser) {
    const conversationId = currentUser.message_chains.filter((id) => {
      for (let i = 0; i < otherUser.message_chains.length; i++) {
        return otherUser.message_chains[i] === id;
      }
    })[0];

    return conversationId;
  }

  function startConversationChain(messageObj) {
    let conversationId = '';

    return $q((resolve, reject) => {
      $http.post('https://brainify-ddc05.firebaseio.com/conversations.json', angular.toJson(messageObj))
        .success((response) => {
          console.log('Success! Stored a message chain in Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to store a message chain in Firebase:', error);
          reject(error);
        });
    })
    .then((messageObj) => {
      // Extracting the unique Firebase key from the response
      const patchData = { fbKey: messageObj.name };
      // Caching the Firebase key to save on each user object later
      conversationId = messageObj.name;
      // Save the changes to the network to Firebase
      return modifyMessage(patchData);
    })
    .then(() => {
      const users = messageObj.users;
      return $q.all(
        users.map((uid) => {
          return UserSettingsFactory.getUserFromFirebase(uid);
        })
      );
    })
    .then((usersArray) => {
      console.log('usersArray:', usersArray);
      const keys = usersArray.map((userObj) => Object.keys(userObj)[0]);
      console.log('Keys:', keys);
      const users = keys.map((key, index) => usersArray[index][key]);
      console.log('Users:', users);
      users.forEach((user) => {
        if (!user.message_chains) {
          user.message_chains = [];
        }
        user.message_chains.push(conversationId);
      });

      return $q.all(
        users.map((user) => {
          return UserSettingsFactory.modifyExistingUser(user);
        })
      );
    });
  }

  function deleteConversation(fbKey) {
    return $q((resolve, reject) => {
      $http.delete(`https://brainify-ddc05.firebaseio.com/conversations/${modifiedObj.fbKey}.json`)
        .success((response) => {
          console.log('Success! Removed message from Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to delete message from Firebase:', error);
          reject(error);
        });
    });
  }

  function modifyMessage(modifiedObj) {
    return $q((resolve, reject) => {
      $http.patch(`https://brainify-ddc05.firebaseio.com/conversations/${modifiedObj.fbKey}.json`, angular.toJson(modifiedObj))
        .success((response) => {
          console.log('Success! Updated a message in Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to update a message in Firebase:', error);
          reject(error);
        });
    });
  }

  return {
    deleteConversation,
    modifyMessage,
    startConversationChain
  }
}

module.exports = MessagingFactory;
