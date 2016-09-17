'use strict';

const firebase = require('firebase');

function UserSettingsFactory($q, $http, Spotify, AuthFactory) {
  let _currentUser;

  /**
   * Gets the cached user object. This object needs to be loaded
   * from Firebase prior to caching.
   * @returns {Object}
   *     Current user object from Firebase
   */
  function getCurrentUser() {
      // Return the object nested in the unique Firebase key
      let key = Object.keys(_currentUser)[0];
      return _currentUser[key];
    }
  }

  function setCurrentUser(userObj) {
    _currentUser = userObj;
  }

  /**
   * Creates a user object to be stored in Firebase
   * @param  {Object} spotifyUser
   *     Spotify user object
   * @param  {Object} firebaseUser
   *     Firebase user object
   * @return {Object}
   *     Object with properties from both user objects to be stored in Firebase.
   */
  function buildUserObject(spotifyUser, firebaseUser) {
    return {
      display_name: spotifyUser.display_name,
      public: true,
      spotifyId: spotifyUser.id,
      link_to_spotify: spotifyUser.external_urls.spotify,
      image: spotifyUser.images[0].url,
      uid: firebaseUser.uid,
      fbKey: ''
    }
  }

  /**
   * Checks if a user is authenticated through Firebase
   * @return {Boolean}
   *     If user is authenticated
   */
  function getCurrentFirebaseUser() {
    return AuthFactory.isAuthenticated() ? firebase.auth().currentUser : null;
  }

  /**
   * Saves the new user's settings to Firebase
   * @returns {Promise}
   *     Resolves to Firebase key from user in Firebase
   */
  function saveNewUser() {
    return Spotify.getCurrentUser()
      .then((spotifyUser) => {
        let userObj = buildUserObject(spotifyUser, getCurrentFirebaseUser());
        return $q.resolve(userObj);
      })
      .then((userObj) => {
        return $q((resolve, reject) => {
          $http.post('https://brainify-ddc05.firebaseio.com/users.json', angular.toJson(userObj))
            .success((response) => {
              console.info('Success! Saved user:', response);
              resolve(response);
            })
            .error((error) => {
              console.error('Error saving user in Firebase:', error);
              reject(error);
            });
        });
      })
      .then((firebaseResponse) => {
        // Saves the unique Firebase key onto the object in Firebase
        let patchData = { fbKey: firebaseResponse.name };
        return modifyExistingUser(patchData);
      });
  }

  /**
   * Returns user object from Firebase
   * @param  {String} uid
   *     Firebase uid
   * @return {Promise}
   *     Resolves to user if found, otherwise rejected
   */
  function getUserFromFirebase(uid) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/users.json?orderBy="uid"&equalTo="${uid}"`)
        .success((userObj) => {
          if (Object.keys(userObj).length === 0) {
            console.error('Error finding user. Got ', userObj)
            reject(userObj);
          }
          console.log('Success! User found:', userObj);
          resolve(userObj);
        })
        .error((error) => {
          console.error('Error finding user:', error);
          reject(error);
        });
    });
  }

  /**
   * Modifies a user's settings in Firebase
   * @param  {Object} modifiedUserObj
   *     Object with properties to change in Firebase
   * @return {Promise}
   *     User object from Firebase
   */
  function modifyExistingUser(modifiedUserObj) {
    return $q((resolve, reject) => {
      $http.patch(`https://brainify-ddc05.firebaseio.com/users/${modifiedUserObj.fbKey}.json`, angular.toJson(modifiedUserObj))
        .success((response) => {
          console.info('Modified user in Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Error modifying user in Firebase:', error);
          reject(error);
        });
    });
  }

  /**
   * Returns an existing user or creates and returns new one
   * @return {Promise}
   *     Resolves to user object
   */
  function checkIfUserExistsOnLogin() {
    let user = getCurrentFirebaseUser();
    return getUserFromFirebase(user.uid)
      .catch((error) => {
        console.log('Saving new user in Firebase...');
        return saveNewUser();
      });
  }

  return {
    checkIfUserExistsOnLogin,
    modifyExistingUser,
    getCurrentUser,
    setCurrentUser
  };
}

module.exports = UserSettingsFactory;
