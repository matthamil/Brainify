# Brainify (Work in Progress)

Brainify creates smart Spotify playlists using machine learning techniques.

![Brainify Mockup](https://i.imgur.com/2XcyWcX.jpg)

![Brainify Logged in Mockup](https://i.imgur.com/l5dN5g6.jpg)

## Getting Started

Download or clone the project to your machine. You will need a [Spotify API key](https://developer.spotify.com/my-applications/#!/applications) to run the project locally.

Create a `SpotifyConfig.js` file inside the `app` directory with the following:

```
'use strict';

function SpotifyAPISetup(SpotifyProvider) {
  SpotifyProvider.setClientId('YOUR_CLIENT_ID_FROM_SPOTIFY');
  SpotifyProvider.setRedirectUri('YOUR_REDIRECT_URI');
  SpotifyProvider.setScope('user-read-private playlist-read-private playlist-modify-private playlist-modify-public');
}

module.exports = SpotifyAPISetup;
```

Install the dependencies:

```
npm install
```

Run `npm run bundle` to build Brainify locally.

## Machine learning techniques

Brainify relies on [Synaptic.js](http://synaptic.juancazala.com/#/) to create [neural networks](https://github.com/cazala/synaptic/wiki/Neural-Networks-101) that learn a user's music preferences.
