'use strict';

app.factory('UserPlaylists', ($q, $http, Spotify) => {
  // Stores the user object upon login
  let user;

  // Returns the current user information
  let getUserInfo = () => {
    return Spotify.getCurrentUser()
      .then((currentUser) => {
        console.log('Logged in user: ', currentUser);
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
      // *****************
      // NOTE: Can't request all song features upon page load. API limit reached.
      // The code below attempts to find all song features as the playlists are
      // loaded. Song features for songs in each playlist will have to be loaded
      // one by one later.
      // *****************
      // .then((playlistsArray) => {
      //   // Find the audio track features for each song in each playlist
      //   console.log('Finding audio track features for each playlist.');
      //   console.log('User playlists:', user.playlists);
      //   return $q.all(
      //     user.playlists.map((playlist) => {
      //       // About to go deep into this data...
      //       return playlist.songList.items.map((song) => {
      //         return Spotify.getTrackAudioFeatures(song.track.id);
      //       });
      //     })
      //   );
      // })
      .then((data) => {
        console.log('Returning user:', user);

        // Returning the cached user object
        return $q.resolve(user);
      });
  };

  // Stores the user's selected playlist. Used to train a neural network.
  let playlist;

  // Used to cache the selected playlist
  let setSelectedPlaylist = (playlistId) => {
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
    console.log(playlist);
  };

  // Returns the selected playlist
  let getSelectedPlaylist = () => playlist;

  let constructVectorFromObj = (obj) => {
    let featureArray = [];
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
  };

  let getAudioFeaturesForPlaylist = (playlist) => {
    return Spotify.getTracksAudioFeatures(
        playlist.songList.items.map((song) => {
          return song.track.id;
        })
      )
      .then((data) => {
        // Convert the object data into vectors
        let audioFeaturesArray = data.audio_features.map((feature, index) => {
          let vector = constructVectorFromObj(feature);
          playlist.songList.items[index].track.features = vector;
          return vector;
        });

        console.log(audioFeaturesArray);
        console.log(playlist);
      });
  };

  return {
    getUserInfo,
    setSelectedPlaylist,
    getSelectedPlaylist,
    getAudioFeaturesForPlaylist
  };
});
