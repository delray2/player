let player;
let currentTrack;
let accessToken;
let device_id;

// Fetch the access token from the backend
async function fetchAccessToken() {
  try {
    const response = await fetch('http://localhost:8888/getAccessToken');
    const data = await response.json();
    accessToken = data.access_token;
    console.log('Access Token:', accessToken);
  } catch (err) {
    console.error('Error fetching access token:', err);
  }
}

// Initialize the Spotify Web Playback SDK
window.onSpotifyWebPlaybackSDKReady = async () => {
  await fetchAccessToken();

  if (!accessToken) {
    console.error('Access token is not available. Make sure to fetch it before initializing the player.');
    return;
  }

  player = new Spotify.Player({
    name: 'Spotify Web Player',
    getOAuthToken: cb => { cb(accessToken); }
  });

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error('Initialization Error:', message); });
  player.addListener('authentication_error', ({ message }) => { console.error('Authentication Error:', message); });
  player.addListener('account_error', ({ message }) => { console.error('Account Error:', message); });
  player.addListener('playback_error', ({ message }) => { console.error('Playback Error:', message); });

  // Playback status updates
  player.addListener('player_state_changed', state => { 
    console.log('Player State Changed:', state);
    updateDisplay(state);
  });

  // Ready
  player.addListener('ready', async ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    await setActiveDevice(device_id);
  });

  // Connect to the player!
  await player.connect();
}

// Update the display with current track info and album artwork
function updateDisplay(state) {
  if (state && state.track_window && state.track_window.current_track) {
    
    const { name, album, artists } = state.track_window.current_track;
    document.getElementById('current-track').textContent = `${name} - ${artists[0].name}`;
    document.getElementById('album-art').src = album.images[0].url;

    
  }
}

// Search for tracks
async function search() {
  const query = document.getElementById('query').value;
  const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${query}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  displaySearchResults(data.tracks.items);
}

// Display search results
function displaySearchResults(tracks) {
  const searchResultsDiv = document.getElementById('search-results');
  searchResultsDiv.innerHTML = '';
  tracks.forEach(track => {
    const trackDiv = document.createElement('div');
    trackDiv.className = 'search-item';
    trackDiv.innerHTML = track.name + ' - ' + track.artists[0].name;
    trackDiv.onclick = () => play(track.uri);
    searchResultsDiv.appendChild(trackDiv);
  });
}

// Play a specified track on the Web Playback SDK's active device.
async function play(trackUri) {
  try {
    await fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [trackUri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });
  } catch (err) {
    console.error('Error playing track:', err);
  }
}

// Pause playback
async function pause() {
  await player.pause();
  console.log('Paused playback');
}

// Skip to the next track
async function nextTrack() {
  await player.nextTrack();
  console.log('Skipped to next track');
}

// Skip to the previous track
async function previousTrack() {
  await player.previousTrack();
  console.log('Moved to previous track');
}

// Set the web player as the active device
async function setActiveDevice(device_id) {
  try {
    await fetch(`https://api.spotify.com/v1/me/player`, {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [device_id], play: false }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });
  } catch (err) {
    console.error('Error setting active device:', err);
  }
}

// Initialize the Web Playback SDK upon page load
window.addEventListener('load', () => {
  fetchAccessToken();  // Fetch the access token right away
});

let isPlaying = false;
let isVisible = false;
let currentVolume = 0.5;  // Default volume level
 

// Toggle between play and pause
function togglePlayPause() {
  if (isPlaying) {
    pause();
  } else {
    resume();
  }
}

// Pause playback
async function pause() {
  await player.pause();
  isPlaying = false;
  document.getElementById("playPause").textContent = "⊳";
}

// Resume playback
async function resume() {
  await player.resume();
  isPlaying = true;
  document.getElementById("playPause").textContent = "▯▯";
  
}

// Adjust the volume
function adjustVolume(delta) {
  currentVolume = Math.min(1, Math.max(0, currentVolume + delta));
  player.setVolume(currentVolume);
}

// Toggle search bar visibility
function toggleSearch() {
if (isVisible) {
    hide();
  } else {
    show();
}
}
function show() {
  const searchContainer = document.getElementById("search-container");
  const overlay = document.getElementById("overlay");
  const searchContaine = document.getElementById("query");
  const searchButton = document.getElementById("searchBtn");
  searchButton.style.display = "block";
  searchContainer.style.display = "block";
  searchContaine.style.display = "block";
  overlay.style.zIndex = "10";
  overlay.style.display = "block"
  searchContainer.style.zIndex = 20;
  isVisible = true;
}
function hide() {
const searchContainer = document.getElementById("search-container");
  const overlay = document.getElementById("overlay");
  const searchContaine = document.getElementById("query");
const searchButton = document.getElementById("searchBtn");
searchButton.style.display = "none";
 
searchContainer.style.display = "none";
  searchContaine.style.display = "none";
  overlay.style.zIndex = "-10";
  searchContainer.style.zIndex = -20;
  isVisible = false;
}


  


// Execute a search query
function executeSearch() {
  const query = document.getElementById("query").value;
  search(query);
}

