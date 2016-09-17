'use strict';

const firebase = require('firebase');

function AuthFactory($q) {
  /**
   * Gets the current user's uid
   * @return {String}
   *     Unique Firebase uid string
   */
  function getUid() {
    return firebase.auth().currentUser.uid;
  }

  // Google Auth Setup
  const provider = new firebase.auth.GoogleAuthProvider();

  /**
   * Attempts to authorize a user with Google
   * @return {Promise}
   *     Resolves to a response object containing user info
   */
  function logInGoogle() {
    return firebase.auth().signInWithPopup(provider)
    .then((result) => {
      return $q.resolve(result.user);
    })
    .catch((error) => {
      console.error('Error logging in with Google:', error);
    });
  }

  // TODO: FUNCTION CURRENTLY NOT USED. PLANNING TO USE SOON.
  /**
   * Creates a new user in Firebase with email and password
   * @param  {Object} userObj
   *     Contains two properties: email and password
   * @return {Promise}
   *     Resolves to user object from Firebase authorization
   */
  function createUser(userObj) {
    return firebase.auth().createUserWithEmailAndPassword(userObj.email, userObj.password)
      .catch((error) => {
        console.error('Error creating new user with email and password:', error);
      });
  }

  /**
   * Attempts to log in a user with email and password
   * @param  {Object} userObj
   *     Contains two properties: email and password
   * @return {Promise}
   *     Resolves to user object from Firebase authorization
   */
  function loginUser(userObj) {
    return firebase.auth().signInWithEmailAndPassword(userObj.email, userObj.password)
      .catch((error) => {
        console.error('Error signing in with email and password:', error);
      });
  }

  /**
   * Logs out a user from Firebase
   * @return {Promise}
   *     Resolves no data
   */
  function logoutUser() {
    console.info('User has signed out.');
    return firebase.auth().signOut();
  }

  /**
   * Checks if the user is authenticated with Firebase
   * @return {Boolean}
   *     If the user is authenticated
   */
  const isAuthenticated = () => firebase.auth().currentUser ? true : false;

  return {
    createUser,
    getUid,
    isAuthenticated,
    logInGoogle,
    loginUser,
    logoutUser
  };
}

module.exports = AuthFactory;
