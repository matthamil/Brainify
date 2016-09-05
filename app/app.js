'use strict';

let angular = require('angular');

// Dependencies for Angular app
require('angular-route');
require('angular-spinner');
require('angular-spotify');

// Main Angular module
let app = angular.module('Brainify', ['ngRoute', 'angularSpinner', 'spotify']);

// Loading Controllers
require('./controllers');
// Loading Factories
require('./factories');

// Routing
app.config(require('./Routes'));

// Spotify API Configuration
app.config(require('./SpotifyConfig'));
