'use strict';

function LearningController($scope, $q, SynapticFactory, PlaylistsFactory, Spotify, FirebaseFactory) {

  $scope.playlist = PlaylistsFactory.getSelectedPlaylist();

  const user = PlaylistsFactory.getSpotifyUser();
  $scope.otherUser = PlaylistsFactory.getOtherUser();

  $scope.test = () => {
    console.log('Playlist:', $scope.playlist);
  };

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

  $scope.takeAGuess = () => {
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
  };

  $scope.clickedCorrectOrWrong = false;

  $scope.correctGuess = () => {
    SynapticFactory.declareCorrectPrediction(
      $scope.songPredictionResult,
      $scope.predictedSongFeatures,
      $scope.lastSearchResult.id
    );
    $scope.clickedCorrectOrWrong = true;
    console.log('getNetworkFirebaseObj:', SynapticFactory.getNetworkFirebaseObj());
    PlaylistsFactory.modifyNetwork(SynapticFactory.getNetworkFirebaseObj())
      .then((objFromFirebase) => {
        console.log('Updated network in Firebase after correct guess:', objFromFirebase);
        SynapticFactory.setNetwork(objFromFirebase);
        setReadyStateForNextSearch();
      });
  };

  $scope.wrongGuess = () => {
    SynapticFactory.declareWrongPrediction(
      $scope.songPredictionResult,
      $scope.predictedSongFeatures,
      $scope.lastSearchResult.id
    );
    $scope.clickedCorrectOrWrong = true;
    PlaylistsFactory.modifyNetwork(SynapticFactory.getNetworkFirebaseObj())
      .then((objFromFirebase) => {
        console.log('Updated network in Firebase after wrong guess:', objFromFirebase);
        SynapticFactory.setNetwork(objFromFirebase);
        setReadyStateForNextSearch();
      });
  };

  function setReadyStateForNextSearch() {
    $scope.songPredictionResult = undefined;
    $scope.predictedSongFeatures = undefined;
    $scope.lastSearchResult = undefined;
  }

  $scope.hardReset = () => {
    PlaylistsFactory.resetAndUpdateNetwork();
  }

  $scope.saveToPlaylist = () => {
    $scope.clickedCorrectOrWrong = false;
    // Note: Neural network has been retrained prior to adding to the playlist.
    Spotify.addPlaylistTracks(user.id, $scope.playlist.id, $scope.lastSearchResult.uri)
      .then((response) => {
        console.info(`Saved song to playlist ${$scope.playlist.id}`)
        $scope.lastSearchResult = undefined;
      });
  }
}

module.exports = LearningController;
