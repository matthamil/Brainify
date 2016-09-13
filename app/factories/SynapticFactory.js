'use strict';

let syn = require('synaptic');

function SynapticFactory(Spotify) {
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
    myNetwork
  };
}

module.exports = SynapticFactory;
