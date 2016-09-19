'use strict';

function MessagingFactory($q, $http) {
  function sendMessage(messageObj) {
    return $q((resolve, reject) => {
      $http.post('https://brainify-ddc05.firebaseio.com/messages.json', angular.toJson(messageObj))
        .success((response) => {
          console.log('Success! Stored a message in Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to store a message in Firebase:', error);
          reject(error);
        });
    })
    .then((messageObj) => {
      // Extracting the unique Firebase key from the response
      const patchData = { fbKey: messageObj.name };
      // Save the changes to the network to Firebase
      return modifyMessage(patchData);
    });
  }

  function deleteMessage(fbKey) {
    return $q((resolve, reject) => {
      $http.delete(`https://brainify-ddc05.firebaseio.com/messages/${modifiedObj.fbKey}.json`)
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
      $http.patch(`https://brainify-ddc05.firebaseio.com/messages/${modifiedObj.fbKey}.json`, angular.toJson(modifiedObj))
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

  function getMessagesForUser(uid) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/messages.json?orderBy="uid"&equalTo="${uid}"`)
        .success((response) => {
          console.log(`Found messages for user with uid ${uid}:`, response);
          resolve(response);
        })
        .error((error) => {
          console.error(`Failed to find messages for user with uid ${uid}:`, error);
        });
    })
    .then((messagesObj) => {
      const keys = Object.keys(messagesObj);
      const messages = keys.map((key) => messagesObj[key]);
      return $q.resolve(messages);
    });
  }

  return {
    deleteMessage,
    getMessagesForUser,
    modifyMessage,
    sendMessage,
  }
}

module.exports = MessagingFactory;
