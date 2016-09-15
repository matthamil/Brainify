'use strict';

let syn = require('synaptic');

function SynapticFactory(Spotify) {
  let _networkFirebaseObj;


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
    myNetwork = new syn.Network({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });
  }

  function setNetwork(network) {
    let key = Object.keys(network)[0];
    _networkFirebaseObj = network[key];
    let neuralNetwork = syn.Network.fromJSON(network[key].jsonNetwork);
    myNetwork = neuralNetwork;
  }

  function getNetwork() {
    return myNetwork;
  }

  function getNetworkFirebaseObj() {
    _networkFirebaseObj.jsonNetwork = myNetwork.toJSON();
    return _networkFirebaseObj;
  }

  /**
   * Trains the neural network with songs
   * @param  {Array<Float>} playlist   Song features for the playlist
   * @param  {Array<Float>} dummySongs Song features for nonplaylist songs
   */
  let trainNetwork = (playlist, dummySongs) => {
    // Training the network
    let learningRate = 0.01;
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

  let correctNetwork = (song, value) => {
    console.log('Retraining network...');
    myNetwork.activate(song[0]);
    for (let i = 0; i < 100; i++) {
      myNetwork.propagate(0.01, [value]);
    }
    console.log('Done correcting network!');
  };

  /**
   * Predicts if the song should be in the playlist.
   * The neural network MUST be trained prior.
   * @param  {Array<Float>} song Song features array
   * @return {Array<Integer>} Array with [0,1] (fits playlist) or [1,0] (does not fit)
   */
  let makePrediction = (song) => {
    console.log('song to make a prediction for:', song[0]);
    let results = [];

    // Testing the network
    results.push(myNetwork.activate(song[0]));
    console.log('results:', results);

    return results;
  };

  return {
    trainNetwork,
    makePrediction,
    myNetwork,
    buildNetwork,
    getNetwork,
    getNetworkFirebaseObj,
    setNetwork,
    correctNetwork
  };
}

module.exports = SynapticFactory;
