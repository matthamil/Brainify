'use strict';

const firebase = require('firebase');

function PlaylistsFactory($q, $http, Spotify, FirebaseFactory, SynapticFactory) {
  // Stores the user object upon login
  let user;
  // Stores a searched user
  let otherUser;

  const getSpotifyUser = () => user;
  const setOtherUser = (user) => { otherUser = user; };
  const getOtherUser = () => otherUser;

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
   * @param  {Array} a
   *     An x-dimensional array
   * @return {Array}
   *     1D array
   */
  function flatten(a) {
    return Array.isArray(a) ? [].concat(...a.map(flatten)) : a;
  }

  /**
   * Removes repeated items in an array
   * @param  {Array} a
   *     An array with potential duplicate values
   * @return {Array}
   *     Array with unique values
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
   * Returns the current user along with an added property containing the user playlists.
   * User playlists can be found on the user object in user.playlists[i].songList, which
   * contains a list of song objects from Spotify.
   * @return {Promise}
   *     Resolves to the current user with a new property: user.playlists[i].songList
   */
  function getUserInfo() {
    return Spotify.getCurrentUser()
      .then((currentUser) => {
        console.log('Logged in user: ', currentUser);
        // If no display image
        if (currentUser.images.length === 0) {
          currentUser.images.push({url: 'https://i.imgur.com/UO5zWtC.png'});
          currentUser.display_name = currentUser.id;
        }
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
        // Returning the cached user object
        return $q.resolve(user);
      });
  }

  function getOtherUserInfo(userObj) {
    return Spotify.getUserPlaylists(otherUser.spotifyId)
      .then((playlistsObj) => {
        console.log(`Found playlists for user ${otherUser.display_name}:`, playlistsObj.items);
        // Save the users playlists
        otherUser.playlists = playlistsObj.items;

        // Find the songs in each playlist
        return $q.all(
          otherUser.playlists.map((playlist) => {
            return Spotify.getPlaylistTracks(playlist.owner.id, playlist.id);
          })
        );
      })
      .then((playlistsArray) => {
        // Save the songs in each playlist
        playlistsArray.forEach((playlist, index) => {
          otherUser.playlists[index].songList = playlist;
        });
        // Returning the cached user object
        return $q.resolve(otherUser);
      })
      .catch((error) => {
        // If the user has no playlists
        return $q.reject(new Error('No playlists found.'));
      })
      .then(() => {
        return getAllNetworksForOtherUser(otherUser.uid);
      })
      .then((networksObj) => {
        if (Object.keys(networksObj).length === 0) {
          console.error(`Error! ${otherUser.display_name} doesn't have any playlists uploaded!`);
          return $q.reject(networksObj);
        }
        const keys = Object.keys(networksObj);
        const networks = keys.map((key) => networksObj[key]);
        return $q.resolve(networks);
      })
      .then((networksArray) => {
        otherUser.playlists = otherUser.playlists.reduce((foundList, playlist) => {
          for (let i = 0; i < networksArray.length; i++) {
            if (playlist.id === networksArray[i].playlistId) {
              foundList.push(playlist);
            }
          }
          return foundList;
        }, []);

        return $q.resolve(otherUser);
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

    let selectedUser;

    if (otherUser) {
      selectedUser = otherUser;
    } else {
      selectedUser = user;
    }

    // Locate the correct playlist by id
    playlist = selectedUser.playlists.filter((playlist) => {
      return playlist.id === playlistId;
    })[0];

    console.log('Selected playlist:', playlist.name);
  }

  // Returns the selected playlist
  function getSelectedPlaylist() { return playlist; }

  /**
   * Restructures the audio features object from Spotify to to a 1D array
   * @param  {Object} obj
   *     Audio features object from Spotify API
   * @return {Array<float>}
   *     1D Array of audio features
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
   * Gets the audio features for a given playlist
   * @param  {Object} playlist
   *     The playlist to find song features for
   * @return {Promise}
   *     Resolves to a 2D array where each index is an array of audio features from a song
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
   * @param  {Array<string>} songIdsArray
   *     List of Spotify song ids
   * @return {Promise}
   *     Resolves to audio features array
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
   * Determines the genres in a playlist
   * @param  {Object} playlist
   *     A user's Spotify playlist
   * @return {Promise}
   *     Resolves to an array of genre names
   */
  function determineGenreFromPlaylist(playlist) {
    // Extracting artist IDs from the playlist object
    let artistIds = playlist.songList.items.map((item) => {
        return item.track.artists.map(artist => artist.id);
    });

    artistIds = flatten(artistIds);

    // Can only query up to 50 artists at a time
    console.log('Artist IDs from playlist:', artistIds);

    const shortenedArtistIds = artistIds.slice(0, 50);

    console.log('Shortened artist ID list:', shortenedArtistIds);

    return buildGenreListFromArtists(shortenedArtistIds);
  }

  /**
   * Gathers the positive and negative case song data to be used to train a network
   * @param {Object} playlist
   *     A user's Spotify playlist
   * @return {Promise}
   *     Resolves to a training data object containing information about the positive
   *     and negative cases to be used to train a network.
   */
  function collectSongDataForNeuralNetwork(playlist) {
    let positiveCase = [];
    let negativeCase = [];
    return determineGenreFromPlaylist(playlist)
    .then((genresFound) => {
      console.log('Genres found in user playlist:', genres);
      const genresArray = getUniqueArrayItems(
        genresFound.map((genre) => {
          // Genre names from the Spotify API have spaces between multiple-word genre names
          //   Example: "heavy metal"
          // Genres cached in Firebase use "-" to separate words in a genre name
          //   "heavy metal" -> "heavy-metal"
          return genre.replace(/\s/g, '-');
        })
      );
      genres.setList(genresArray);
    })
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

      // The network trains best when the number of positive songs is approximately
      // the number of negative songs. This takes a random sampling of n
      // songs from the total list of negative songs pulled from Firebase,
      // where n = number of songs in the playlist.
      let randomNegative = [];
      for (let i = 0; i < positiveCase.length; i++) {
        randomNegative.push(negativeCase[Math.floor(Math.random() * negativeCase.length)]);
      }

      let trainingDataObj = {
        positive: positiveCase,
        negative: randomNegative,
        positive_ids: playlist.songList.items.map(song => song.track.id),
        negative_ids: ['empty'] // Firebase will not save this property if this array is empty
      };

      SynapticFactory.cacheTrainingData(trainingDataObj);

      console.log('Training data obj:', trainingDataObj);

      return $q.resolve(trainingDataObj);
    })
  }

  /**
   * Creates an array of each artist's genres
   * @param  {Array} artistIds
   *     List of artist IDs
   * @return {Promise}
   *     Resolves to an array of each artist's genres
   */
  function buildGenreListFromArtists(artistIds) {
    return Spotify.getArtists(artistIds)
      .then((data) => {
        console.log('Response data from getArtist:', data);
        let artists = data.artists;
        let genresList = [];

        // Accumulate the list of each genre
        artists.forEach((artist) => {
          genresList.push(artist.genres);
        });

        // Remove duplicates in the list
        genresList = getUniqueArrayItems(flatten(genresList));

        return $q.resolve(genresList);
      });
  }

  /**
   * Converts a neural network into an object to be stored in Firebase
   * @param  {Network} network
   *     Synaptic neural network
   * @return {Object}
   *     Network object to be saved in Firebase
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
   * @param  {Network} network
   *     Synaptic neural network
   * @return {Promise}
   *     Resolves to neural network object stored in Firebase
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
   *     Object with properties that need updating in Firebase
   * @return {Promise}
   *     Resolves to the neural network object from Firebase
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
   * @param  {String} playlistId
   *     Spotify playlist id
   * @return {Promise}
   *     Resolves to network from Firebase
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
      console.error(`Network with playlist ID ${playlistId} does not exist in Firebase. Creating new network in Firebase.`, error);
      return initialNetworkSetup();
    });
  }

  /**
   * Deletes a neural network from Firebase
   * @param {String} networkFbKey
   *     Firebase key where neural network is stored
   * @return {Promise}
   *     Resolves to Firebase success
   */
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

  /**
   * Loads a neural network's training data object from Firebase
   * @param {String} networkFbKey
   *     Firebase key where neural network is stored
   * @return {Promise}
   *     Resolves to a neural network's training data
   */
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

  /**
   * Sets up a neural network for the first time. This includes finding
   * the appropriate training data and training the network. If the network
   * is new, it will be saved in Firebase. If not, then the network has been
   * reset and will be updated in Firebase.
   * @param {Boolean} isNewNetwork
   *     If the neural network is new or already in Firebase
   * @return {Promise}
   *    Resolves to network object from Firebase
   */
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
      .then(() => {
        return $q.resolve(new Date())
      });
  }

  /**
   * Forces a network to reset by deleting it and saving a new network
   * in Firebase
   * @return {void}
   */
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

  function getAllNetworksForOtherUser(fbKey) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/networks.json?orderBy="uid"&equalTo="${fbKey}"`)
        .success((response) => {
          console.log(`Found all networks in Firebase with Firebase uid ${fbKey}:`, response);
          resolve(response);
        })
        .error((error) => {
          console.error('Failed to get networks from Firebase:', error);
          reject(error);
        });
    });
  }

  /**
   * Loads and caches all networks from Firebase for the current user and return all networks
   * except the network that is for the currently selected playlist
   * @return {void}
   */
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
    collectSongDataForNeuralNetwork,
    getAudioFeaturesForPlaylist,
    getAudioFeaturesForSongIds,
    getOtherUser,
    getOtherUserInfo,
    getNetwork,
    getSelectedPlaylist,
    getSpotifyUser,
    getUserInfo,
    loadAllOtherNetworks,
    modifyNetwork,
    resetAndUpdateNetwork,
    saveNetwork,
    setOtherUser,
    setSelectedPlaylist
  };
}

module.exports = PlaylistsFactory;
