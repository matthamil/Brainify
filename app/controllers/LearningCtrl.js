'use strict';

function LearningController($scope, $q, SynapticFactory, UserPlaylists, Spotify, FirebaseFactory) {
  $scope.user = UserPlaylists.user;

  $scope.playlist = UserPlaylists.getSelectedPlaylist();

  $scope.test = () => {
    console.log('User:', $scope.user);
    console.log('Playlist:', $scope.playlist);
  };

  $scope.firebaseTest = () => {
    FirebaseFactory.getNegativeGenresSongFeatures(['bluegrass', 'country'])
      .then((data) => {
        console.log(data);
      })
  }

  $scope.genreTest = () => {
    console.log('$scope.playlist:', $scope.playlist);
    UserPlaylists.collectSongDataForNeuralNetwork($scope.playlist)
      .then((trainingData) => {
        let startTime = new Date();
        console.log('Started: training the network at ', startTime);
        SynapticFactory.trainNetwork(trainingData.positive, trainingData.negative);
        let endTime = new Date();
        let timeDiff = (endTime - startTime)/1000;
        console.info(`Completed training the network in ${timeDiff} seconds.`);
      });
  };

  // Stores the search results for display in the search results table
  $scope.searchResults = [];

  // Stores the ids for each dummy song
  $scope.dummySongIds = [];

  // Stores full info on each dummy song
  $scope.dummySongs = [];

  // Search input
  $scope.songToSearch = '';

  $scope.addToDummySongsArray = (song) => {
    $scope.dummySongs.push(song);
    $scope.dummySongIds.push(song.id);
    console.log('Dummy songs so far:', $scope.dummySongs);
    $scope.searchResults = [];
  };

  $scope.searchSong = (title) => {
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
    UserPlaylists.getAudioFeaturesForSongIds($scope.dummySongIds)
      .then((featuresVector) => {
        dummySongsFeaturesVector = featuresVector;
      })
      .then((data) => {
        // Finding the audio features for the "correct" songs
        return UserPlaylists.getAudioFeaturesForPlaylist($scope.playlist);
      })
      .then((featuresVector) => {
        // Training the network
        SynapticFactory.trainNetwork(featuresVector, dummySongsFeaturesVector);
        console.info('Completed training the network.');
      })
  };

  $scope.songToPredict = '';

  $scope.resetPredictionSearch = () => {
    $scope.songToPredict = '';
    $scope.songToPredictSearchResult = false;
    SynapticFactory.correctNetwork(songToPredictFeatures, Math.round($scope.songPredictionResult));
    $scope.correct = false;
    $scope.incorrect = false;
  };

  let songToPredictFeatures;

  $scope.networkGuessedWrong = () => {
    $scope.showHowToFix = true;
  };

  $scope.correctNetwork = () => {
    SynapticFactory.correctNetwork(songToPredictFeatures, $scope.correctResponse);
    $scope.showHowToFix = false;
    $scope.correct = false;
    $scope.incorrect = false;
  };

  $scope.showHowToFix = false;

  $scope.takeAGuess = () => {
    Spotify.search($scope.songToPredict, 'track', {limit: 1})
      .then((data) => {
        console.log(data);
        $scope.songToPredictSearchResult = data.tracks.items[0];
        return $q.resolve([data.tracks.items[0].id]);
      })
      .then((arr) => {
        return UserPlaylists.getAudioFeaturesForSongIds(arr);
      })
      .then((featuresVector) => {
        songToPredictFeatures = featuresVector;
        $scope.songPredictionResult = SynapticFactory.makePrediction(featuresVector);
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
}

module.exports = LearningController;
