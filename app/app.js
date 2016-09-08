'use strict';

let angular = require('angular');

// Dependencies for Angular app
require('angular-route');
require('angular-spinner');
require('angular-spotify');

// Main Angular module
const MODULE_NAME = 'Brainify';

let app = angular.module(MODULE_NAME, ['ngRoute', 'angularSpinner', 'spotify']);

// Loading Controllers
require('./controllers');
// Loading Factories
require('./factories');

// Routing
app.config(require('./Routes'));

// Spotify API Configuration
app.config(require('./SpotifyConfig'));

export default MODULE_NAME;
