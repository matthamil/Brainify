'use strict';

let syn = require('synaptic');

function SynapticFactory($q, Spotify) {
  let _networkFirebaseObj = {};
  let _trainingDataCache;

  // Creating the layers in the network
  let inputLayer = new syn.Layer(7);
  let hiddenLayer = new syn.Layer(3);
  let outputLayer = new syn.Layer(1);

  // Connect the layers
  inputLayer.project(hiddenLayer);
  hiddenLayer.project(outputLayer);

  // Build the neural network
  let myNetwork = new syn.Network({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
  });

  function buildNetwork() {
    // Creating the layers in the network
    let inputLayer = new syn.Layer(7);
    let hiddenLayer = new syn.Layer(3);
    let outputLayer = new syn.Layer(1);

    // Connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    myNetwork = new syn.Network({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });
  }

  let _allOtherNetworks;

  function cacheAllOtherNetworks(networksArray) {
    _allOtherNetworks = networksArray;
  }

  function convertFromJsonNetwork(networkObj) {
    networkObj.jsonNetwork = syn.Network.fromJSON(networkObj.jsonNetwork);
  }

  function makePredictionAllOtherNetworks(songFeaturesArray, songId) {
    debugger;
    console.log('songFeaturesArray:', songFeaturesArray);
    if (!_allOtherNetworks) {
      throw Error (`Failed to make predictions on all networks! All other networks are ${_allOtherNetworks}!`);
    }
    let resultsArray = _allOtherNetworks.map((networkObj) => {
      // If the song is in the positive training data set
      if (networkObj.trainingData.positive_ids.indexOf(songId) >= 0) {
        console.log(`Found song in positive training data cache of ${networkObj.name}`);
      }
      // If the song is in the negative training data set
      else if (networkObj.trainingData.negative_ids.indexOf(songId) >= 0) {
        console.log(`Found song in positive training data cache of ${networkObj.name}`);
      }
      else {
        debugger;
        return {
          result: networkObj.jsonNetwork.activate(songFeaturesArray[0])[0],
          name: networkObj.name,
          id: networkObj.playlistId
        };
      }
    });
    return resultsArray;
  }

  function setNetwork(network) {
    if (!network || Object.keys(network).length === 0) { return; }
    console.log('network inside setNetwork:', network);
    const key = Object.keys(network)[0];
    console.log('key:', key);
    _networkFirebaseObj = network[key];
    console.log('Setting the network cache:', _networkFirebaseObj);

    myNetwork = syn.Network.fromJSON(network[key].jsonNetwork);
    // myNetwork = network[key].jsonNetwork;

    if (!network[key].trainingData) {
      _networkFirebaseObj.trainingData = _trainingDataCache;
      console.log('Adding training data to the network cache:', _networkFirebaseObj);
    } else {
      _trainingDataCache = network[key].trainingData;
      _networkFirebaseObj.trainingData = network[key].trainingData;
    }
  }

  function getNetwork() {
    return myNetwork;
  }

  function getNetworkFirebaseObj() {
    _networkFirebaseObj.jsonNetwork = myNetwork.toJSON();
    // _networkFirebaseObj.trainingData = _trainingDataCache;
    console.log('_networkFirebaseObj in getNetworkFirebaseObj:', _networkFirebaseObj);
    return _networkFirebaseObj;
  }

  function cacheTrainingData(trainingDataObj) {
    _networkFirebaseObj.trainingData = trainingDataObj;
  }

  function getTrainingDataCache() {
    return _trainingDataCache;
  }

  /**
   * Trains the neural network with songs
   *
   * @param  {Array<float>} playlist
   *     Song features for the playlist
   * @param  {Array<float>} dummySongs
   *     Song features for nonplaylist songs
   */
  let trainNetwork = (playlist, dummySongs) => {
    // Training the network
    const learningRate = 0.01;
    for (let i = 0; i < 40000; i++) {
      playlist.forEach((song) => {
        myNetwork.activate(song);
        myNetwork.propagate(learningRate, [1]);
      });

      dummySongs.forEach((song) => {
        myNetwork.activate(song);
        myNetwork.propagate(learningRate, [0]);
      });
    }
  };

  // TODO: DEPRECATED FUNCTION.
  // USE: retrainNetworkWithNewSong
  let correctNetwork = (song, value) => {
    console.log('Retraining network...');
    myNetwork.activate(song[0]);
    for (let i = 0; i < 100; i++) {
      myNetwork.propagate(0.01, [value]);
    }
    console.log('Done correcting network!');
  };

  /**
   * Resets the current neural network and retrains it
   *
   * @param  {Array<string>} songFeaturesArray
   *     List of song features for a searched song
   * @param  {String} songId
   *     Spotify song ID
   * @param  {Integer} value
   *     0, representing a negative result, or 1, representing a positive result
   * @return {Promise}
   *     Resolves to _networkFirebaseObj
   */
  function retrainNetworkWithNewSong(songFeaturesArray, songId, value) {
    // Reset the neural network
    buildNetwork();
    addToTrainingDataCache(songFeaturesArray, songId, value);
    // Train the newly reset network
    console.log('_trainingDataCache:', _trainingDataCache);
    trainNetwork(_trainingDataCache.positive, _trainingDataCache.negative);
    // Save changes to network in Firebase
  }

  /**
   * Predicts if the song should be in the playlist.
   * The neural network MUST be trained prior.
   *
   * @param {Array<float>} song
   *     Song features array from Spotify
   * @param {String} songId Spotify song ID
   * @return {Array<float>}
   *     Array with a number between 0 and 1. 0 representing the network guessed
   *     that the song does not fit. 1 representing the network guessed that the
   *     song does fit.
   */
  function makePrediction(song, songId) {
    if (_networkFirebaseObj.trainingData.positive_ids.indexOf(songId) >= 0) {
      console.log('Found song in positive training data cache:', songId);
      return [1];
    }

    else if (_networkFirebaseObj.trainingData.negative_ids.indexOf(songId) >= 0) {
      console.log('Found song in negative training data cache:', songId);
      return [0];
    }

    console.log(`Could not find song in training data. Testing network with new song ${songId}.`);

    console.log('song to make a prediction for:', song[0]);
    let results = [];

    // Testing the network
    results.push(myNetwork.activate(song[0]));
    console.log('results:', results);

    return results[0];
  }

  function roundPredictionValue(value) {
    return Math.round(value);
  }

  function declareWrongPrediction(value, songFeaturesArray, songId) {
    let correctValue;

    // Flip the predicted value
    if (roundPredictionValue(value) === 0) {
      correctValue = [1];
    } else {
      correctValue = [0];
    }
    retrainNetworkWithNewSong(songFeaturesArray, songId, correctValue);
  }

  function declareCorrectPrediction(value, songFeaturesArray, songId) {
    console.log('Value:', value);
    console.log('songFeaturesArray:', songFeaturesArray);
    console.log('songId', songId);
    const correctValue = [roundPredictionValue(value)];
    retrainNetworkWithNewSong(songFeaturesArray, songId, correctValue);
  }

  function addToPositiveSongCache(songFeaturesArray, songId) {
    _networkFirebaseObj.trainingData.positive_ids.push(songId);
    _networkFirebaseObj.trainingData.positive.push(songFeaturesArray);
  }

  function addToNegativeSongCache(songFeaturesArray, songId) {
    _networkFirebaseObj.trainingData.negative_ids.push(songId);
    _networkFirebaseObj.trainingData.negative.push(songFeaturesArray);
  }

  function addToTrainingDataCache(songFeaturesArray, songId, value) {
    if (value[0] === 1) {
      addToPositiveSongCache(songFeaturesArray, songId);
    } else {
      addToNegativeSongCache(songFeaturesArray, songId);
    }
  }

  function networkResetHard() {
    // Build a new network
    buildNetwork();
    // Generate new random negative songs and train
    const isFirstTimeSetup = false;
    _trainingDataCache = {};
    return $q.resolve(isFirstTimeSetup);
  }

  return {
    trainNetwork,
    makePrediction,
    makePredictionAllOtherNetworks,
    myNetwork,
    convertFromJsonNetwork,
    cacheAllOtherNetworks,
    buildNetwork,
    getNetwork,
    getNetworkFirebaseObj,
    setNetwork,
    networkResetHard,
    correctNetwork,
    cacheTrainingData,
    getTrainingDataCache,
    retrainNetworkWithNewSong,
    declareCorrectPrediction,
    declareWrongPrediction
  };
}

module.exports = SynapticFactory;
