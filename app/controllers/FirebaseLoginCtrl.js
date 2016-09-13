'use strict';

function FirebaseLoginController($scope, $window, AuthFactory) {
  $scope.login = () => {
    AuthFactory.logInGoogle()
    .then((userData) => {
      console.log('Success! Logged in with Google:', userData);
      // $location.url breaks, use $window
      $window.location.href = '#/connect-with-spotify';
    })
    .catch((error) => {
      console.error('Failed to login with Google.', error);
    });
  };
}

module.exports = FirebaseLoginController;
