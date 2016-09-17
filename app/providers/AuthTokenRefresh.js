'use strict';

const keys = require('../SpotifyKeys');

function AuthTokenRefresh() {
  let authToken;
  return {
    $get: function(Spotify, $interval, $http) {
      return {
        isAuth: function() {
          return authToken ? true : false;
        },
        setAuthToken: function(token) {
          authToken = token;
          console.log(`Success! Auth token cached: ${authToken}`);
          Spotify.authToken = authToken;
          console.log(Spotify);
          $interval(function() {
            console.log('Hello, world');
            // console.log(localStorage.getItem('test'));
            // const authOptions = {
            //   method: 'POST',
            //   url: 'https://accounts.spotify.com/api/token',
            //   headers: { 'Authorization': 'Basic ' + (window.btoa(keys.CLIENT_ID) + ':' + window.btoa(keys.CLIENT_SECRET)) },
            //   form: {
            //     grant_type: 'refresh_token',
            //     refresh_token: authToken
            //   }
            // };

            // $http(authOptions).then((data) => {
            //   console.log(data);
            // });
            // Spotify.login()
          }, 5000);
        }
      };
    }
  };
}

module.exports = AuthTokenRefresh
