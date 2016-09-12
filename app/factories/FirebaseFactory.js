'use strict';

function FirebaseFactory(($q, $http) => {

  function getSongFeaturesFromGenre(genre) {
    return $q((resolve, reject) => {
      $http.get(`https://brainify-ddc05.firebaseio.com/-KRQvqIBCFfxEsFaovny/${genre}.json`)
        .then((data) => {
          resolve(data);
        }, (rejectData) => {
          reject(rejectData);
        })
    });
  }

  function getNegativeGenresSongFeatures(genreList) {
    return $q.all(
      return genreList.map((genre) => {
        return getSongFeaturesFromGenre(genre);
      })
    );
  }

  return {
    getSongFeaturesFromGenre
  };
});

module.exports = FirebaseFactory;
