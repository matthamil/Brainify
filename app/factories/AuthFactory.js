'use strict';

const firebase = require('firebase');

function AuthFactory($q) {
  /**
   * Gets the current user's uid
   * @return {String} A uid string
   */
  const getUid = () => {
    return firebase.auth().currentUser.uid;
  };

  // Google Auth Setup
  const provider = new firebase.auth.GoogleAuthProvider();

  /**
   * Attempts to authorize a user with Google
   * @return {Promise} Resolves to a response object containing user info
   */
  const logInGoogle = () => {
    return firebase.auth().signInWithPopup(provider)
    .then((result) => {
      return $q.resolve(result.user);
    })
    .catch((error) => {
      console.error('Error logging in with Google:', error);
    });
  };

  /**
   * Creates a new user in Firebase with email and password
   * @param  {Object} userObj Contains two properties: email and password
   * @return {Promise} Resolves to user object from Firebase auth
   */
  const createUser = (userObj) => {
    return firebase.auth().createUserWithEmailAndPassword(userObj.email, userObj.password)
      .catch((error) => {
        console.error('Error creating new user with email and password:', error);
      });
  };

  /**
   * Attempts to log in a user with email and password
   * @param  {Object} userObj Contains two properties: email and password
   * @return {Promise} Resolves to user object from Firebase auth
   */
  const loginUser = (userObj) => {
    return firebase.auth().signInWithEmailAndPassword(userObj.email, userObj.password)
      .catch((error) => {
        console.error('Error signing in with email and password:', error);
      });
  };

  /**
   * Logs out a user
   * @return {Promise} Resolves no data
   */
  const logoutUser = () => {
    console.info('User has signed out.');
    return firebase.auth().signOut();
  };

  /**
   * Checks if the user is logged in
   * @return {Boolean} if the user is authenticated
   */
  const isAuthenticated = () => firebase.auth().currentUser ? true : false;

  return {
    createUser,
    loginUser,
    logoutUser,
    isAuthenticated,
    logInGoogle,
    getUid
  };
}

module.exports = AuthFactory;
