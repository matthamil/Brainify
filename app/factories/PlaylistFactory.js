'use strict';

function UserPlaylistsFactory($q, $http, Spotify, FirebaseFactory) {
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

  /**
   * Used when the user has selected a playlist that is 5 songs or shorter
   * @param  {String} trackIdsString A comma separated list of track IDs
   * @return {Promise} Resolves to track info
   */
  function getRecommendationsForShortPlaylist(trackIdsString) {
    return Spotify.getRecommendations({ seed_tracks: trackIdsString, limit: 100 })
      .then((songRecommendations) => {
        return $q.resolve(songRecommendations.tracks);
      });
  }

  /**
   * Determines the predominant genre in a playlist with over 20 songs.
   * @param  {Array<string>} trackIds List of track IDs from a playlist
   * @return {Promise} Resolves to the predominant genre
   */
  function determineGenreFromLongPlaylist(trackIds) {
    if (trackIds.length < 20) { return throw new Error('Playlist needs to be longer than 20 songs.')}


  }

  /**
   * Converts the response from the getRecommendations API endpoint to an array
   * of track IDs
   * @return {Promise} Resolves to an array of track IDs
   */
  function convertRecommendationsToTrackIdList(response) {
    return response.map((track) => {
      return track.id;
    });
  }

  /**
   * Finds artist IDs in the recommendations response. Needed to query
   * getArtists API endpoint to find genres.
   * @param  {Array} tracks Response from getRecommendationsForShortPlaylist
   * @return {Promise} Resolves to array of artist Ids
   */
  function getArtistIdsFromRecommendation(tracks) {
    return tracks.map((track) => {
      return track.album.id;
    });
  }

  /**
   * Creates a tally of each artists' genre
   * @param  {Array} artistIds  List of artist IDs
   * @return {Promise} Resolves to object with tally of each genre
   */
  function buildGenreCounterFromArtists(artistIds) {
    return Spotify.getArtists(artistIds)
      .then((data) => {
        let artists = data.artists;
        let genresList = [];
        let genresObj = {};

        // Accumulate the list of each genre
        artists.forEach((artist) => {
          genresList.push(artist.genres);
        });

        // Convert the list into a counter object
        for (let i = 0; i < genresList.length; i++) {
          for (let j = 0; j < genresList[i]; j++) {
            // If the genre does not exist on the object
            if (!genresObj[genresList[i][j]]) {
              genresObj[genresList[i][j]] = 1;
            }
            // If the genre does exist on the object
            else {
              genresObj[genresList[i][j]]++;
            }
          }
        }

        return $q.resolve(genresObj);
      });
  }

  /**
   * Returns the genre with the highest count on the objet
   * @param  {Object} genresCounterObj Resolved from buildGenreCounterFromArtists
   * @return {Array} Array of genre(s) with highest count
   */
  function getModeFromGenres(genresCounterObj) {
    let maxCount = 0;
    let determinedGenre = [];
    for (let genre in genresCounterObj) {
      if (genresCounterObj[genre] > maxCount) {
        maxCount = genresCounterObj[genre];
        determinedGenre = [genre];
      }

      else if (genresCounterObj[genre] === maxCount) {
        maxCount = genresCounterObj[genre];
        determinedGenre.push(genre);
      }
    }

    return determinedGenre;
  }

  /**
   * Resolves to a 2D array of all other genres' song features
   * @param  {Array} genre Return from getModeFromGenres
   * @return {Promise} Resolves to negative song features
   */
  function getNegativeGenres(genreList) {
    let genres = ['acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal', 'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop', 'chicago-house', 'children', 'chill', 'classical', 'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 'deep-house', 'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk', 'forro', 'french', 'funk', 'garage', 'german', 'gospel', 'goth', 'grindcore', 'groove', 'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal', 'hip-hop', 'holidays', 'honky-tonk', 'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian', 'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin', 'latino', 'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno', 'movies', 'mpb', 'new-age', 'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 'pop', 'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock', 'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip', 'rock', 'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter', 'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish', 'synth-pop', 'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music']
    genreList.forEach((genre) => {
      genres.find((genreInList, index) => {
        if (genre === genreInList) {
          genres.splice(index, 1);
        }
      });
    });

    return genres;
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
