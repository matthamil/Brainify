'use strict';

const firebase = require('firebase');

function MessagingFactory($q, $http, UserSettingsFactory) {
  let _selectedConversation;

  function setSelectedConversation(conversation) {
    _selectedConversation = conversation;
  }

  function getSelectedConversation() {
    return _selectedConversation;
  }

  function getConversationById(conversationId) {
    return $q((resolve, reject) => {
          $http.get(`https://brainify-ddc05.firebaseio.com/conversations/${conversationId}.json`)
            .success((response) => {
              console.log('Success! Found message chain:', response);
              resolve(response);
            })
            .error((error) => {
              console.error('Failed to find message chain:', error);
              reject(error);
            });
        });
  }

  function addMessageToChain(messageObj) {
    return findConversationId(messageObj.users)
      .then((conversationId) => {
        return getConversationById(conversationId);
      })
      .then((conversationObj) => {
        console.log('Here ya go:', conversationObj);
        messageObj.messages.forEach((message) => {
          conversationObj.messages.push(message);
        });
        console.log('Added messages:', conversationObj);

        return $q((resolve, reject) => {
          $http.patch(`https://brainify-ddc05.firebaseio.com/conversations/${conversationObj.fbKey}.json`, angular.toJson(conversationObj))
            .success((response) => {
              console.log(`Success! Patched the new message into the existing conversation with id ${conversationObj.fbKey}:`, response);
              resolve(response);
            })
            .error((error) => {
              console.error(`Failed to patch the new message into the existing conversation with id ${conversationObj.fbKey}:`, error);
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

  function deleteConversation(messageObj) {
    return $q((resolve, reject) => {
      $http.delete(`https://brainify-ddc05.firebaseio.com/conversations/${messageObj.fbKey}.json`)
        .success((response) => {
          console.log('Success! Removed message from Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to delete message from Firebase:', error);
          reject(error);
        });
    })
    .then((response) => {
      return $q.all(
        messageObj.users.map(uid => UserSettingsFactory.getUserFromFirebase(uid))
      );
    })
    .then((usersObj) => {
      const keys = Object.keys(usersObj);
      let users = keys.map(key => usersObj[key]);
      users = users.map((user) => {
        const key = Object.keys(user)[0];
        console.log('user object before finding index:', user);
        const index = user[key].message_chains.indexOf(messageObj.fbKey);
        console.log('index!', index);
        user[key].message_chains.splice(index, 1);
        if (user[key].message_chains.length === 0) {
          delete user[key].message_chains;
        }

        return user[key];
      });

      console.log('Users after removing:', users);
      return $q.all(
        users.map(user => UserSettingsFactory.modifyExistingUserWithPut(user))
      );
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

  function getConversationsForUser(uid) {
    let userConversations;
    return UserSettingsFactory.getUserFromFirebase(uid)
      .then((userObj) => {
        const key = Object.keys(userObj)[0];
        if (userObj[key].message_chains) {
          const conversationIds = userObj[key].message_chains;
          return $q.all(
            conversationIds.map(id => getConversationById(id))
          );
        } else {
          return $q.reject('No conversations found on user.');
        }
      })
      .then((conversations) => {
        userConversations = conversations;
        console.log('conversations:', conversations);

        // Find the uids of the other users in the current users conversations
        const otherUserUids = conversations.map((conversation) => {
          return conversation.users.filter((uid) => {
            return uid !== firebase.auth().currentUser.uid;
          })[0];
        });

        console.log(otherUserUids);
        // Find the other user's display name
        return $q.all(
          otherUserUids.map(uid => UserSettingsFactory.getUserFromFirebase(uid))
        );
      })
      .then((otherUsersObj) => {
        console.log(otherUsersObj);
        const keys = Object.keys(otherUsersObj);
        const otherUsers = keys.map(key => otherUsersObj[key]);

        // Adding a property on each conversation with information about the other user
        userConversations.forEach((conversation) => {
          const otherUserUid = otherUsers.filter((user) => {
            return conversation.users.indexOf(user.uid) != -1;
          })[0];

          const otherUserObj = otherUsers.filter((user) => {
            return user.uid === otherUserUid;
          })[0];

          const otherUserKey = Object.keys(otherUserObj)[0];
          conversation.otherUser = otherUserObj[otherUserKey];
        });

        console.log(userConversations);

        return $q.resolve(userConversations);
      })
      .catch((error) => {
        console.error('Failed to find conversations:', error);
        return $q.resolve([]);
      });
  }

  return {
    addMessageToChain,
    deleteConversation,
    getConversationsForUser,
    getSelectedConversation,
    modifyMessage,
    setSelectedConversation,
    startConversationChain
  }
}

module.exports = MessagingFactory;
