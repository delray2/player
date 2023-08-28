let player;
let currentTrack;
let accessToken;

// Function to fetch access token from your backend
async function fetchAccessToken() {
  const response = await fetch('http://localhost:8888/getAccessToken'); // Replace with your backend endpoint
  const data = await response.json();
  accessToken = data.access_token;
}

// Initialize Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = async () => {
  await fetchAccessToken(); // Fetch the access token

  player = new Spotify.Player({
    name: 'Spotify Web Player',
    getOAuthToken: cb => { cb(accessToken); }
  });

  player.addListener('player_state_changed', state => {
    currentTrack = state.track_window.current_track;
    document.getElementById('track-name').innerText = currentTrack.name;
    document.getElementById('artist-name').innerText = currentTrack.artists[0].name;
    document.getElementById('cover-art').src = currentTrack.album.images[0].url;
  });

  player.connect();
};

async function search() {
  const query = document.getElementById('query').value;
  const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  const results = data.tracks.items;
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';
  results.forEach(track => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'search-item';
    trackDiv.innerText = `${track.name} - ${track.artists[0].name}`;
    trackDiv.onclick = () => queueTrack(track.uri);
    resultsDiv.appendChild(trackDiv);
  });
}

function queueTrack(uri) {
  player.queue(uri);
}

function play() {
  player.togglePlay();
}

function pause() {
  player.togglePlay();
}

function skip() {
  player.nextTrack();
}

function rewind() {
  player.previousTrack();
}
