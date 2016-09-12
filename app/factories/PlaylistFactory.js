'use strict';

function UserPlaylistsFactory($q, $http, Spotify) {
  // Stores the user object upon login
  let user;

  // Stores the user's selected playlist. Used to train a neural network.
  let playlist;
  /**
   * Returns the current user along with user playlists as a property
   * @return {Object} current user
   */
  function getUserInfo() {
    return Spotify.getCurrentUser()
      .then((currentUser) => {
        console.log('Logged in user: ', currentUser);
        // Cache the current user
        user = currentUser;
      })
      .catch((error) => {
        return $q.reject(new Error('No signed in user.'));
      })
      .then((currentUser) => {
        // Find the user's playlists
        return Spotify.getUserPlaylists(user.id);
      })
      .catch((error) => {
        // If the user has no playlists
        return $q.reject(new Error('No playlists found.'));
      })
      .then((playlistsObj) => {
        // Save the users playlists
        user.playlists = playlistsObj.items;

        // Find the songs in each playlist
        return $q.all(
          user.playlists.map((playlist) => {
            return Spotify.getPlaylistTracks(playlist.owner.id, playlist.id);
          })
        );
      })
      .then((playlistsArray) => {
        // Save the songs in each playlist
        playlistsArray.forEach((playlist, index) => {
          user.playlists[index].songList = playlist;
        });
      })
      .then((data) => {
        // Returning the cached user object
        return $q.resolve(user);
      });
  }

  // Used to cache the selected playlist
  function setSelectedPlaylist(playlistId) {
    // Prevent the playlist from being redefined if it is already
    // pointing to the correct playlist
    if (playlist) {
      if (playlistId === playlist.id) {
        return;
      }
    }

    // Locate the correct playlist by id
    playlist = user.playlists.filter((playlist) => {
      return playlist.id === playlistId;
    })[0];

    console.log('Selected playlist:', playlist.name);
  }

  // Returns the selected playlist
  function getSelectedPlaylist() { return playlist; }

  /**
   * Restructures the audio features object to to an array
   * @param  {Object} obj Audio features object from Spotify API
   * @return {Array <float>}  Array of audio features
   */
  function constructVectorFromObj(obj) {
    let featureArray = [];
    // Features to be used by the neural network
    // All features are on a scale from 0 to 1
    featureArray.push(
      obj.acousticness,
      obj.danceability,
      obj.energy,
      obj.instrumentalness,
      obj.liveness,
      obj.speechiness,
      obj.valence
    );
    return featureArray;
  }

  /**
   * Finds the audio features for a given playlist
   * @param  {Object} playlist The playlist to find song features for
   * @return {Promise} Resolves the audio features array
   */
  function getAudioFeaturesForPlaylist(playlist) {
    return Spotify.getTracksAudioFeatures(
        playlist.songList.items.map((song) => {
          return song.track.id;
        })
      )
      .then((data) => {
        // Convert the object data into vectors
        let audioFeaturesArray = data.audio_features.map((feature, index) => {
          let vector = constructVectorFromObj(feature);
          // Add the features vector to each track object
          playlist.songList.items[index].track.features = vector;
          return vector;
        });

        return $q.resolve(audioFeaturesArray);
      });
  }

  /**
   * Finds the audio features for a given list of song ids
   * @param  {Array <string>} songIdsArray List of song ids
   * @return {Promise}  resolves audio features array
   */
  function getAudioFeaturesForSongIds(songIdsArray) {
    return Spotify.getTracksAudioFeatures(songIdsArray)
    .then((data) => {
      // Convert the object data into vectors
      let audioFeaturesArray = data.audio_features.map((feature, index) => {
        let vector = constructVectorFromObj(feature);
        // Add the features vector to each track object
        playlist.songList.items[index].track.features = vector;
        return vector;
      });

      return $q.resolve(audioFeaturesArray);
    });
  }

  function getRecommendationsForShortPlaylist(trackIdsString) {
    return Spotify.getRecommendations({ seed_tracks: trackIdsString})
      .then((songRecommendations) => {
        return $q.resolve(songRecommendations.tracks);
      });
  }

  function extractAlbumsFromRecommendation(recTracks) {
    
  }

  return {
    user,
    getUserInfo,
    setSelectedPlaylist,
    getSelectedPlaylist,
    getAudioFeaturesForPlaylist,
    getAudioFeaturesForSongIds
  };
}

module.exports = UserPlaylistsFactory;
