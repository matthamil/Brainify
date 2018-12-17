# Brainify

[![Dependency Status](https://david-dm.org/matthamil/Brainify/status.svg)](https://david-dm.org/matthamil/Brainify#info=dependencies) [![devDependency Status](https://david-dm.org/matthamil/Brainify/dev-status.svg)](https://david-dm.org/preboot/angular-webpack#info=devDependencies) [![Greenkeeper badge](https://badges.greenkeeper.io/matthamil/Brainify.svg)](https://greenkeeper.io/)

Brainify creates smart Spotify playlists using machine learning techniques.

[Read the blog post about Brainify](http://matthamil.me/Machine-Learning-with_JavaScript/)

[Watch the YouTube walkthrough](https://www.youtube.com/watch?v=doYjvcNLA2Y)

![Brainify Mockup](https://i.imgur.com/2XcyWcX.jpg)

[Mockups](https://imgur.com/a/1vKQx)

## Getting Started

Download or clone the project to your machine. You will need a [Spotify API key](https://developer.spotify.com/my-applications/#!/applications) to run the project locally.

Create a `SpotifyConfig.js` file inside the `app` directory with the following:

```javascript
'use strict';

function SpotifyAPISetup(SpotifyProvider) {
  SpotifyProvider.setClientId('YOUR_CLIENT_ID_FROM_SPOTIFY');
  SpotifyProvider.setRedirectUri('YOUR_REDIRECT_URI');
  SpotifyProvider.setScope('user-read-private playlist-read-private playlist-modify-private playlist-modify-public');
}

module.exports = SpotifyAPISetup;
```

Firebase configuration settings are not included in this repo.

Install the dependencies:

```bash
npm install
```

Run `npm run build` to build Brainify locally.

## Machine learning techniques

Brainify relies on [Synaptic.js](http://synaptic.juancazala.com/#/) to create [neural networks](https://github.com/cazala/synaptic/wiki/Neural-Networks-101) that learn a user's music preferences.
