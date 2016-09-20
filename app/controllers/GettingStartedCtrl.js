'use strict';

function GettingStartedController($scope, $location, $route, PlaylistsFactory, UserSettingsFactory, Spotify) {
  // Boolean to control loading animation
  $scope.showSpinner = true;

  $scope.searchedUser = '';

  $scope.showOtherUserPlaylists = false;

  $scope.searchUser = () => {
    if ($scope.searchedUser !== '') {
      console.log(`Searching for user: ${$scope.searchedUser}`);
      const foundUser = $scope.allOtherUsersList.filter((user) => {
        return $scope.searchedUser === user.display_name;
      })[0];

      if (foundUser) {
        console.log(`Found a user with name ${$scope.searchedUser}:`, foundUser);
        PlaylistsFactory.setOtherUser(foundUser);
        PlaylistsFactory.getOtherUserInfo(foundUser)
          .then((otherUser) => {
            $scope.otherUser = otherUser;
            $scope.showOtherUserPlaylists = true;
          });
      }
      $scope.searchedUser = '';
    }
  };

   // Loads the current user and the user's playlists
  $scope.loadUserInfo = () => {
    UserSettingsFactory.checkIfUserExistsOnLogin()
      .then((user) => {
        console.log('User in loadUserInfo in GettingStartedCtrl', user);
        UserSettingsFactory.setCurrentUser(user);
        return UserSettingsFactory.getAllOtherUsersFromFirebase();
      })
      .then((allOtherUsers) => {
        $scope.allOtherUsersList = allOtherUsers;
        return PlaylistsFactory.getUserInfo();
      })
      .then((user) => {
        $scope.user = user;
        // Disble the loading animation
        $scope.showSpinner = false;
      })
      .catch((error) => {
        // If no user is found, redirect to landing page
        console.error('Error: No Spotify user found', error);
        $location.url('/');
      });
  };

  $scope.setSelectedPlaylist = (playlistId) => {
    PlaylistsFactory.setSelectedPlaylist(playlistId);
    // Reroute
    $location.url('/test');
  };

  $scope.goToGettingStarted = () => {
    // Reroute
    $route.reload();
  }
}

module.exports = GettingStartedController;
