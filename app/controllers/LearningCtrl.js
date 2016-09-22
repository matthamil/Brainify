'use strict';

function LearningController($scope, $q, $timeout, $uibModal, toastr, SynapticFactory, PlaylistsFactory, Spotify, FirebaseFactory) {

  $scope.playlist = PlaylistsFactory.getSelectedPlaylist();
  console.log($scope.playlist);

  const user = PlaylistsFactory.getSpotifyUser();
  $scope.user = user;
  $scope.otherUser = PlaylistsFactory.getOtherUser();

  $scope.test = () => {
    console.log('Playlist:', $scope.playlist);
  };

  $scope.hasSearched = false;

  // Stores the search results for display in the search results table
  $scope.searchResults = [];

  // Search input
  $scope.songToSearch = '';

  $scope.searchSong = (title) => {
    $scope.clickedCorrectOrWrong = false;
    // Find dummy song ID
    // Get features for dummy song
    Spotify.search(title, 'track', {limit: 3})
      .then((data) => {
        data.tracks.items.forEach((song) => {
          $scope.searchResults.push(song);
        })

        console.log('Search results:', data);
      });
  };

  $scope.trainNetwork = () => {
    let dummySongsFeaturesVector;
    // Finding the audio features for the "incorrect" songs
    PlaylistsFactory.getAudioFeaturesForSongIds($scope.dummySongIds)
      .then((featuresVector) => {
        dummySongsFeaturesVector = featuresVector;
      })
      .then((data) => {
        // Finding the audio features for the "correct" songs
        return PlaylistsFactory.getAudioFeaturesForPlaylist($scope.playlist);
      })
      .then((featuresVector) => {
        // Training the network
        SynapticFactory.trainNetwork(featuresVector, dummySongsFeaturesVector);
        console.info('Completed training the network.');
      })
  };

  $scope.songToPredict = '';

  let songToPredictFeatures;

  $scope.networkGuessedWrong = () => {
    $scope.showHowToFix = true;
  };

  $scope.showHowToFix = false;

  $scope.takeAGuess = (e) => {
    if (e.keyCode === 13) {
      $scope.clickedCorrectOrWrong = false;
      Spotify.search($scope.songToPredict, 'track', {limit: 1})
        .then((data) => {
          console.log(data);
          $scope.lastSearchResult = data.tracks.items[0];
          $scope.songToPredictSearchResult = data.tracks.items[0];
          return $q.resolve([data.tracks.items[0].id]);
        })
        .then((arr) => {
          return PlaylistsFactory.getAudioFeaturesForSongIds(arr);
        })
        .then((featuresVector) => {
          $scope.hasSearched = true;
          $scope.predictedSongFeatures = featuresVector[0];
          $scope.songPredictionResult = SynapticFactory.makePrediction(featuresVector, $scope.songToPredictSearchResult.id)[0];
          $scope.allOtherNetworkPredictions = SynapticFactory.makePredictionAllOtherNetworks(featuresVector, $scope.songToPredictSearchResult.id);
          $scope.didPredict = true;
          console.log('Prediction:', $scope.songPredictionResult);
          if (Math.round($scope.songPredictionResult)) {
            $scope.correct = true
            $scope.incorrect = false;
          } else {
            $scope.incorrect = true;
            $scope.correct = false;
          }
        });
    }
  };

  $scope.$watch('songToPredict', function listenerForSearch(newValue, oldValue) {
    if (newValue === '') {
      // $scope.hasSearched = false;
      // $scope.clickedCorrectOrWrong = false;
    }
  });

  $scope.clickedCorrectOrWrong = false;

  $scope.correctGuess = () => {
    $scope.clickedCorrectOrWrong = true;
    SynapticFactory.declareCorrectPrediction(
      $scope.songPredictionResult,
      $scope.predictedSongFeatures,
      $scope.lastSearchResult.id
    );
    console.log('getNetworkFirebaseObj:', SynapticFactory.getNetworkFirebaseObj());
    PlaylistsFactory.modifyNetwork(SynapticFactory.getNetworkFirebaseObj())
      .then((objFromFirebase) => {
        console.log('Updated network in Firebase after correct guess:', objFromFirebase);
        SynapticFactory.setNetwork(objFromFirebase);
        setReadyStateForNextSearch();
      });
  };

  $scope.wrongGuess = () => {
    $scope.clickedCorrectOrWrong = true;
    SynapticFactory.declareWrongPrediction(
      $scope.songPredictionResult,
      $scope.predictedSongFeatures,
      $scope.lastSearchResult.id
    );
    PlaylistsFactory.modifyNetwork(SynapticFactory.getNetworkFirebaseObj())
      .then((objFromFirebase) => {
        console.log('Updated network in Firebase after wrong guess:', objFromFirebase);
        SynapticFactory.setNetwork(objFromFirebase);
        setReadyStateForNextSearch();
      });
  };

  function setReadyStateForNextSearch() {
    // $scope.songPredictionResult = undefined;
    $scope.predictedSongFeatures = undefined;
    $scope.lastSearchResult = undefined;
  }

  $scope.hardReset = () => {
    PlaylistsFactory.resetAndUpdateNetwork()
      .then(() => {
        toastr.info('The network for this playlist has been reset.');
        $scope.hasSearched = false;
        $scope.songToPredict = '';
      });
  };

  $scope.saveToPlaylist = () => {
    $scope.clickedCorrectOrWrong = false;
    // Note: Neural network has been retrained prior to adding to the playlist.
    Spotify.addPlaylistTracks(user.id, $scope.playlist.id, $scope.lastSearchResult.uri)
      .then((response) => {
        console.info(`Saved song to playlist ${$scope.playlist.id}`)
        $scope.lastSearchResult = undefined;
      });
  };

  $scope.open = () => {
     let modalInstance = $uibModal.open({
      templateUrl: '../partials/SendMessage.html',
      controller: 'SendMessageCtrl',
      resolve: {
        otherUser: $scope.otherUser,
        song: $scope.lastSearchResult,
        score: $scope.songPredictionResult,
        playlist: $scope.playlist,
        user: function (UserSettingsFactory) {
          return UserSettingsFactory.getCurrentUser();
        }
      }
    });
  };
}

module.exports = LearningController;
