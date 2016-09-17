'use strict';

const firebase = require('firebase');

function PlaylistsFactory($q, $http, Spotify, FirebaseFactory, SynapticFactory) {
  // Stores the user object upon login
  let user;

  const getSpotifyUser = () => user;

  // Stores the user's selected playlist. Used to train a neural network.
  let playlist;

  // Stores the genres that are not in the playlist
  let genres = (function() {
    let list = [];

    return {
      getList() {
        return list;
      },

      setList(newList) {
        list = newList;
      },

      push(item) {
        list.push(item);
      }
    }
  })();



  /**
   * Flattens an array
   * @param  {Array} a Array
   * @return {Array} 1D array
   */
  function flatten(a) {
    return Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
  }

  /**
   * Remove repeat items in an array
   * @param  {Array} a An array with duplicates
   * @return {Array} Filtered array
   */
  function getUniqueArrayItems(a) {
    let seen = {};
    let out = [];
    let len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
      let item = a[i];
      if(seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }

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
   * TODO: DEPRECATED FUNCTION
   * Converts a list of genres into a list of track IDs
   * @param  {Array<string>} genresArray List of genres
   * @return {Promise} Resolves to a list of track IDs
   */
  // function getRecommendationsFromPlaylistGenres(genresArray) {

  //   genresArray = getUniqueArrayItems(
  //     genresArray.map((genre) => {
  //       return genre.split(' ')[0].replace(/\s/g, '-');
  //     })
  //   );

  //   // genres.setList(genresArray);

  //   return $q.all(
  //     genresArray.map((genre) => {
  //       return Spotify.getRecommendations({ seed_genres: genre, limit: 30 });
  //     })
  //   )
  //   .then((data) => {
  //     // Only keep responses that have songs recommended.
  //     // Some recommendations return no songs.
  //     let filteredData = data.filter((response) => {
  //       return response.tracks.length > 0;
  //     });

  //     let trackIds = flatten(
  //       filteredData.map((responseObj) => {
  //         return convertRecommendationsToTrackIdList(responseObj.tracks);
  //       })
  //     );
  //     console.log('Track IDs from recommendations from user\'s playlist:', trackIds);

  //     if (trackIds.length > 100) {
  //       trackIds.slice(0, 100);
  //     }

  //     return $q.resolve(trackIds);
  //   })
  //   .then((trackIds) => {
  //     return Spotify.getTracksAudioFeatures(trackIds);
  //   })
  //   .then((audioFeaturesObj) => {
  //     let featuresArray = audioFeaturesObj.audio_features.map(constructVectorFromObj);
  //     return $q.resolve(featuresArray);
  //   });
  // }

  /**
   * Determines the predominant genre in a playlist with over 20 songs.
   * @param  {Object} playlist A user's playlist
   * @return {Promise} Resolves to the predominant genre
   */
  function determineGenreFromPlaylist(playlist) {
    // if (trackIds.length < 20) { console.error('Playlist needs to be longer than 20 songs.'); return;}

    // Extracting artist IDs from the playlist object
    let artistIds = playlist.songList.items.map((item) => {
        return item.track.artists.map(artist => artist.id);
    });

    artistIds = flatten(artistIds);

    // Can only query up to 50 artists at a time
    console.log('Artist IDs from playlist:', artistIds);

    let shortenedArtistIds = artistIds.slice(0, 50);

    console.log('Shortened artist ID list:', shortenedArtistIds);

    return buildGenreListFromArtists(shortenedArtistIds);
  }

  function collectSongDataForNeuralNetwork(playlist) {
    let positiveCase = [];
    let negativeCase = [];
    return determineGenreFromPlaylist(playlist)
    .then((genresFound) => {
      console.log('Genres found in user playlist:', genres);
      const genresArray = getUniqueArrayItems(
        genresFound.map((genre) => {
          return genre.replace(/\s/g, '-');
        })
      );
      genres.setList(genresArray);
      // return getRecommendationsFromPlaylistGenres(genres);
    })
    // .then((audioFeaturesArray) => {
      // From 'guessing the genre'
      // This skews the neural network's judgment drastically.
      // return $q.resolve(positiveCase = audioFeaturesArray);
    // })
    .then(() => {
      return getAudioFeaturesForPlaylist(playlist);
    })
    .then((audioFeaturesArray) => {
      return $q.resolve(positiveCase = audioFeaturesArray);
    })
    .then(() => {
      return FirebaseFactory.getNegativeGenresSongFeatures(genres.getList());
    })
    .then((negativeSongFeatures) => {
      negativeCase = negativeSongFeatures;

      let randomNegative = [];
      for (let i = 0; i < positiveCase.length; i++) {
        randomNegative.push(negativeCase[Math.floor(Math.random() * negativeCase.length)]);
      }

      let trainingDataObj = {
        positive: positiveCase,
        negative: randomNegative,
        positive_ids: playlist.songList.items.map(song => song.track.id),
        negative_ids: ['empty']
      };

      SynapticFactory.cacheTrainingData(trainingDataObj);

      console.log('Training data obj:', trainingDataObj);

      return $q.resolve(trainingDataObj);
    })
  }

  /**
   * Converts the response from the getRecommendations API endpoint to an array
   * of track IDs
   * @return {Promise} Resolves to an array of track IDs
   */
  function convertRecommendationsToTrackIdList(response) {
    if (!Array.isArray(response)) { return console.error('Error: Make sure you are passing responseObj.tracks!');}
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
      return track.artists[0].id;
    });
  }

  /**
   * Creates a tally of each artists' genre
   * @param  {Array} artistIds  List of artist IDs
   * @return {Promise} Resolves to object with tally of each genre
   */
  function buildGenreListFromArtists(artistIds) {
    return Spotify.getArtists(artistIds)
      .then((data) => {
        console.log('Response data from getArtist:', data);
        let artists = data.artists;
        let genresList = [];
        // let genresObj = {};

        // Accumulate the list of each genre
        artists.forEach((artist) => {
          genresList.push(artist.genres);
        });

        // // Convert the list into a counter object
        // for (let i = 0; i < genresList.length; i++) {
        //   for (let j = 0; j < genresList[i]; j++) {
        //     // If the genre does not exist on the object
        //     if (!genresObj[genresList[i][j]]) {
        //       genresObj[genresList[i][j]] = 1;
        //     }
        //     // If the genre does exist on the object
        //     else {
        //       genresObj[genresList[i][j]]++;
        //     }
        //   }
        // }

        genresList = getUniqueArrayItems(flatten(genresList));

        return $q.resolve(genresList);
      });
  }

  // TODO: DEPRECATED FUNCTION
  /**
   * Returns the genre with the highest count on the objet
   * @param  {Object} genresCounterObj Resolved from buildGenreCounterFromArtists
   * @return {Array} Array of genre(s) with highest count
   */
  // function getModeFromGenres(genresCounterObj) {
  //   let maxCount = 0;
  //   let determinedGenre = [];
  //   for (let genre in genresCounterObj) {
  //     if (genresCounterObj[genre] > maxCount) {
  //       maxCount = genresCounterObj[genre];
  //       determinedGenre = [genre];
  //     }
  //
  //     else if (genresCounterObj[genre] === maxCount) {
  //       maxCount = genresCounterObj[genre];
  //       determinedGenre.push(genre);
  //     }
  //   }
  //
  //   return determinedGenre;
  // }

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


  /**
   * Converts a neural network into an object to be stored in Firebase
   * @param  {Network} network Synaptic network
   * @return {Object} Network object to be saved in Firebase
   */
  function buildNetworkObject(network) {
    const uid = firebase.auth().currentUser.uid;
    const playlistId = playlist.id;
    return {
      uid,
      playlistId,
      name: playlist.name,
      trainingData: network.trainingData,
      fbKey: '',
      jsonNetwork: network.jsonNetwork,
    };
  }

  /**
   * Saves the trained neural network to Firebase
   * @param  {Network} network Synaptic network
   * @return {Promise} Resolves to object stored in Firebase
   */
  function saveNetwork(network) {
    const networkObj = buildNetworkObject(network);
    return $q((resolve, reject) => {
      $http.post('https://brainify-ddc05.firebaseio.com/networks.json', angular.toJson(networkObj))
        .success((objFromFirebase) => {
          console.log('Success! Saved network in Firebase:', objFromFirebase);
          resolve(objFromFirebase);
        })
        .error((error) => {
          console.error('Failed to save network to Firebase:', error);
          reject(error);
        })
    })
    .then((firebaseObj) => {
      // Extracting the unique Firebase key from the response
      const patchData = { fbKey: firebaseObj.name };
      // Save the changes to the network to Firebase
      return modifyNetwork(patchData);
    })
  }

  /**
   * Updates an existing network in Firebase
   * @param  {Object} modifiedNetworkObj
   * @return {Promise} Resolves to the network object from Firebase
   */
  function modifyNetwork(modifiedNetworkObj) {
    return $q((resolve, reject) => {
      $http.patch(`https://brainify-ddc05.firebaseio.com/networks/${modifiedNetworkObj.fbKey}.json`, angular.toJson(modifiedNetworkObj))
        .success((response) => {
          console.log('Success! Updated network in Firebase:', response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to update network in Firebase:', error);
          reject(error);
        });
    })
    .then(() => {
      return getNetwork(playlist.id);
    });
  }

  /**
   * Finds a network in Firebase
   * @param  {String} playlistId Unique playlist id
   * @return {Promise} Resolves to network from Firebase
   */
  function getNetwork(playlistId) {
    let foundNetwork;
    let key;
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/networks.json?orderBy="playlistId"&equalTo="${playlistId}"`)
        .success((response) => {
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to get network from Firebase:', error);
          reject(error);
        });
    })
    .then((network) => {
      if (Object.keys(network).length === 0) {
        return $q.reject(network);
      }
      console.log('Saved network found:', network);
      foundNetwork = network;
      // SynapticFactory.setNetwork(network);
      // return $q.resolve(new Date());
      key = Object.keys(network)[0];
      return getNetworkTrainingData(key);
    })
    .then((trainingData) => {
      console.log('should be trainingData:', trainingData);
      console.log('Should be inside object:', foundNetwork[key]);
      foundNetwork[key].trainingData = trainingData;
      return $q.resolve(SynapticFactory.setNetwork(foundNetwork));
    })
    .catch((error) => {
      console.error(`Network with playlist ID ${playlistId} does not exist in Firebase. Creating new network in Firebase.`);
      return initialNetworkSetup();
    });
  }

  function deleteNetwork(networkFbKey) {
    return $q((resolve, reject) => {
      $http.delete(`https://brainify-ddc05.firebaseio.com/networks/${networkFbKey}.json`)
        .success((response) => {
          console.log(`Deleted network with Firebase Key ${networkFbKey}!`);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to delete network from Firebase:', error);
          reject(error);
        });
    });
  }

  function getNetworkTrainingData(networkFbKey) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/networks/${networkFbKey}/trainingData.json`)
        .success((response) => {
          console.log(`Training data found for Network with Firebase Key ${networkFbKey}:`, response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to get network from Firebase:', error);
          reject(error);
        });
    })
  }

  function initialNetworkSetup(isNewNetwork = true) {
    return collectSongDataForNeuralNetwork(playlist)
      .then((trainingData) => {
        console.log('trainingData inside initialNetworkSetup:', trainingData);
        SynapticFactory.cacheTrainingData(trainingData);
        console.log('Training Data in SynapticFactory cache:', SynapticFactory.getNetworkFirebaseObj());
        const beginTraining = new Date();
        SynapticFactory.trainNetwork(trainingData.positive, trainingData.negative);
        const endTraining = new Date();
        const timeTraining = (endTraining - beginTraining)/1000;
        console.info(`Completed training the network in ${timeTraining} seconds.`);
        if (isNewNetwork) {
          return saveNetwork(SynapticFactory.getNetworkFirebaseObj());
        } else {
          return modifyNetwork(SynapticFactory.getNetworkFirebaseObj())
        }
      })
      .then((networkFromFirebase) => {
        // console.log('Network from firebase:', networkFromFirebase);
        // SynapticFactory.setNetwork(networkFromFirebase);
        return $q.resolve(new Date())
      });
  }

  function resetAndUpdateNetwork() {
    deleteNetwork(SynapticFactory.getNetworkFirebaseObj().fbKey)
      .then(() => {
        return SynapticFactory.networkResetHard()
      })
      .then((isFirstTimeSetup) => {
        return initialNetworkSetup();
      })
      .then((network) => {
        SynapticFactory.setNetwork(network);
        console.log('Network has been reset!', network);
      });
  }

  function loadAllOtherNetworks() {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/networks.json?orderBy="uid"&equalTo="${firebase.auth().currentUser.uid}"`)
        .success((response) => {
          console.log(`Found all networks in Firebase with Firebase uid ${firebase.auth().currentUser.uid}:`, response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to get network from Firebase:', error);
          reject(error);
        });
    })
    .then((responseObj) => {
      let keys = Object.keys(responseObj);
      let networksArray = keys.map((key) => {
        return responseObj[key];
      })
      .filter((networkObj) => {
        return networkObj.fbKey !== SynapticFactory.getNetworkFirebaseObj().fbKey;
      });
      networksArray.forEach(SynapticFactory.convertFromJsonNetwork);
      SynapticFactory.cacheAllOtherNetworks(networksArray);
    })
  }

  return {
    getSpotifyUser,
    getUserInfo,
    resetAndUpdateNetwork,
    setSelectedPlaylist,
    getSelectedPlaylist,
    getAudioFeaturesForPlaylist,
    getAudioFeaturesForSongIds,
    collectSongDataForNeuralNetwork,
    saveNetwork,
    modifyNetwork,
    getNetwork,
    loadAllOtherNetworks
  };
}

module.exports = PlaylistsFactory;
