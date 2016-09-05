'use strict';

app.factory('Synaptic', (Spotify) => {
  // Creating the layers in the network
  let inputLayer = new Layer(7);
  let hiddenLayer = new Layer(3);
  let outputLayer = new Layer(1);

  // Connect the layers
  inputLayer.project(hiddenLayer);
  hiddenLayer.project(outputLayer);

  // Build the neural network
  let myNetwork = new Network({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
  });

  let trainNetwork = (playlist, dummySongs) => {
    // Training the network
    let learningRate = 0.3;
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

  let makePrediction = (song) => {
    let results = [];

    // Testing the network
    results.push(myNetwork.activate(song));

    console.log('Predictions:', results);
    return results;
  };

  return {

  };
});
