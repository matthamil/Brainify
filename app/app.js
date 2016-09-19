'use strict';

let angular = require('angular');

// Dependencies for Angular app
require('angular-route');
require('angular-sanitize');
require('angular-spinner');
require('angular-spotify');
require('angular-ui-bootstrap');
import modal from 'angular-ui-bootstrap/src/modal/index-nocss.js'
const firebase = require('firebase');

// Main Angular module
const MODULE_NAME = 'Brainify';

let app = angular.module(MODULE_NAME, ['ngRoute', 'ngSanitize', 'ui.bootstrap', modal, 'angularSpinner', 'spotify']);

// Loading Controllers
require('./controllers');
// Loading Factories
require('./factories');

// Routing
app.config(require('./Routes'));

// Spotify API Configuration
app.config(require('./SpotifyConfig'));

// Firebase Auth Configuration
const FirebaseConfigObj = require('./FirebaseConfig');
app.constant(FirebaseConfigObj.name, FirebaseConfigObj.data);

app.run(($location, FB_CREDENTIALS) => {
  firebase.initializeApp(FB_CREDENTIALS);
});


export default MODULE_NAME;
