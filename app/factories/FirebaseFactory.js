'use strict';

function FirebaseFactory($q, $http, $cacheFactory) {

  function getSongFeaturesFromGenre(genre) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/-KRQvqIBCFfxEsFaovny/${genre}.json`)
        .success((data) => {
          resolve(data);
        })
        .error((error) => {
          console.error(`Error loading ${genre} data from Firebase:`, error);
          reject(error);
        });
    });
  }

  /**
   * Returns negative genre song features
   * @param  {Array} genreList Return value from PlaylistFactory.getNegativeGenres
   * @return {Promise} Resolves to 2D array of song features
   */
  function getNegativeGenresSongFeatures(genreList) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/-KRQvqIBCFfxEsFaovny.json`, { cache: true })
        .success((data) => {
          resolve(data);
        })
        .error((error) => {
          console.error('Failed to load all genre song features:', error);
          reject(error);
        });
      })
      .then((genresObj) => {
        console.log('Resolved from getNegativeGenresSongFeatures');
        // Remove the negative genres from the genres object
        genreList.forEach((genre) => {
          if (genresObj[genre]) {
            delete genresObj[genre];
            console.log(`Deleted ${genre} from list.`);
          }
        });

        return $q.resolve(genresObj);
      })
      .catch((error) => {
        console.error('Error loading all song features:', error);
      });
    }

  return {
    getSongFeaturesFromGenre,
    getNegativeGenresSongFeatures
  };
}

module.exports = FirebaseFactory;
