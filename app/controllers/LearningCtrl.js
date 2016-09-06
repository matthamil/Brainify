'use strict';

function LearningController($scope, SynapticFactory, UserPlaylists, Spotify, $q) {
  $scope.user = UserPlaylists.user;

  $scope.playlist = UserPlaylists.getSelectedPlaylist();

  $scope.test = () => {
    console.log('User:', $scope.user);
    console.log('Playlist:', $scope.playlist);
  }

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
    UserPlaylists.getAudioFeaturesForSongIds($scope.dummySongIds)
      .then((featuresVector) => {
        console.log('Features vector, line 49:', featuresVector);
        dummySongsFeaturesVector = featuresVector;
      })
      .then((data) => {
        console.log('data, line 53:', data);
        return UserPlaylists.getAudioFeaturesForPlaylist($scope.playlist);
      })
      .then((featuresVector) => {
        console.log('featuresVector before training network, line 57:', featuresVector);
        console.log('dummySongsFeaturesVector, line 58:', dummySongsFeaturesVector);
        SynapticFactory.trainNetwork(featuresVector, dummySongsFeaturesVector);
        console.log('Done training the network.');
      })
  };

  $scope.songToPredict = '';

  $scope.takeAGuess = () => {
    Spotify.search($scope.songToPredict, 'track', {limit: 1})
      .then((data) => {
        console.log('data, line 68:', data);
        return $q.resolve([data.tracks.items[0].id]);
      })
      .then((arr) => {
        console.log('arr, line 72:', arr);
        return UserPlaylists.getAudioFeaturesForSongIds(arr);
      })
      .then((featuresVector) => {
        console.log('featuresVector, line 76:', featuresVector);
        console.log(SynapticFactory.makePrediction(featuresVector));
      });
  };
}

module.exports = LearningController;
