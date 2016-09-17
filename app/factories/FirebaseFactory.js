'use strict';

const firebase = require('firebase');

function FirebaseFactory($q, $http, $cacheFactory) {

  /**
   * Gets song features for a specific genre from Firebase
   * @param {String} genre
   *     Name of a valid genre
   * @return {Promise}
   *     Resolves to the genre's set of song features
   */
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
   * Gets negative genre song features based on a list of positive genres
   * @param  {Array} genreList
   *     Return from PlaylistFactory.getNegativeGenres
   * @return {Promise}
   *     Resolves to 2D array of song features for all negative genres
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

        let negativeGenresList = [];

        for (let key in genresObj) {
          negativeGenresList.push(genresObj[key]);
        }

        let flattenedArr = [];

        negativeGenresList.forEach((genreFeatureGroup, index) => {
          flattenedArr = flattenedArr.concat(genreFeatureGroup.map((features) => {
            return features;
          }));
        });

        return $q.resolve(flattenedArr);
      })
      .catch((error) => {
        console.error('Error loading all song features:', error);
      });
    }

  return {
    getNegativeGenresSongFeatures,
    getSongFeaturesFromGenre
  };
}

module.exports = FirebaseFactory;
