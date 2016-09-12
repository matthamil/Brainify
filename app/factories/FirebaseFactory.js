'use strict';

function FirebaseFactory(($q, $http, $cacheFactory) => {

  function getSongFeaturesFromGenre(genre) {
    return $http.get(`https://brainify-ddc05.firebaseio.com/-KRQvqIBCFfxEsFaovny/${genre}.json`)
      .catch((error) => {
        console.error('Error loading song features from genre:', error);
      });
  }

  function getNegativeGenresSongFeatures(genreList) {
    return $q.all(
      return genreList.map((genre) => {
        return getSongFeaturesFromGenre(genre);
      })
    );
  }

  function getNegativeGenreSongFeatures(genreList) {
    return $http.get(`https://brainify-ddc05.firebaseio.com/-KRQvqIBCFfxEsFaovny.json`, { cache: true })
      .then((genresObj) => {
        // Remove the negative genres from the genres object
        genreList.forEach((genre) => {
          delete genresObj[genre];
        });
        $q.resolve(genreList);
      })
      .catch((error) => {
        console.error('Error loading all song features:', error);
      });
    }
  }

  return {
    getSongFeaturesFromGenre
  };
});

module.exports = FirebaseFactory;
