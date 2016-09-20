'use strict';

function MessagingFactory($q, $http, UserSettingsFactory) {
  function addMessageToChain(messageObj) {
    return findConversationId(messageObj.users)
      .then((conversationId) => {
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
      })
      .catch(() => {
        console.error('No conversation between these two users!');
        console.log('Creating a new conversation...');
        return startConversationChain(messageObj);
      });
  }

  function deleteMessageFromChain() {
    // TODO
  }

  function findConversationId(users) {
    return $q.all(users.map(user => UserSettingsFactory.getUserFromFirebase(user)))
      .then((usersArray) => {
        const keys = usersArray.map(user => Object.keys(user));

        console.log(usersArray);
        if (!usersArray[0][keys[0]].message_chains || !usersArray[1][keys[1]].message_chains) {
          return $q.reject();
        }

        // Find the intersection of the two arrays
        // Returns a conversation id that both users share
        const conversationId = usersArray[0][keys[0]].message_chains.filter((n) => {
          return usersArray[1][keys[1]].message_chains.indexOf(n) != -1;
        })[0];

        if (!conversationId) {
          return $q.reject();
        } else {
          return $q.resolve(conversationId);
        }
      });
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
    addMessageToChain,
    deleteConversation,
    modifyMessage,
    startConversationChain
  }
}

module.exports = MessagingFactory;
