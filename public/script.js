
let videoPlayer;
let searchResults = [];
let queue = [];
let accessToken;
let currentTrack;
let originalTrack;
let gradients = [];
let animationFrameId;
// Fetch Spotify Access Token
async function fetchAccessToken() {
  try {
    const response = await fetch("http://localhost:8881/getAccessToken");
    const data = await response.json();
    accessToken = data.access_token;
    console.log("Access Token:", accessToken);
  } catch (err) {
    console.error("Error fetching access token:", err);
  }
}

async function updateAlbumArtworkAndGradient() {
  if (currentTrack) {
    const youtubeQuery = `${currentTrack.title} official video`;
    youtubeSearch(youtubeQuery, true);

    if (currentTrack.album && currentTrack.album.images && currentTrack.album.images[0]) {
      const imageUrl = currentTrack.album.images[0].url;

      // Set album artwork
      const albumArtwork = document.getElementById("album-artwork");
      const showQueueButton = document.getElementById("showQueueButton");

      albumArtwork.src = imageUrl;
      showQueueButton.style.backgroundImage = `url('${imageUrl}')`;

      // Trigger the gradient animation
      triggerGradientAnimation(imageUrl);
    }
  }
}


// Initialize Spotify API
async function initializeSpotify() {
  await fetchAccessToken();
  const player = new Spotify.Player({
    name: "Web Playback SDK",
    getOAuthToken: (cb) => {
      cb(accessToken);
    }
  });

  player.addListener("ready", ({ device_id }) => {
    console.log("Ready with Device ID", device_id);
  });

  await player.connect();
}

// Initialize YouTube API
function initializeYouTube() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube Player Ready
function onPlayerReady(event) {
  console.log("YouTube Player is ready");
}

// YouTube Player State Change


// YouTube API is ready
window.onYouTubeIframeAPIReady = function() {
    videoPlayer = new YT.Player("video-player", {
      width: "80%",
      height: "100%",
      playerVars: {
        controls: 0
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });

};

// YouTube Search
// YouTube Search

function youtubeSearch(query, playImmediately = false) {
  const API_KEY = "AIzaSyBGK7G8GK-8tecU0rpWkxmYD55g1MuZeWg";
  fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&key=${API_KEY}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        const videoTitle = data.items[0].snippet.title;
        queue.push({ id: videoId, title: videoTitle }); // store video ID and title in the queue
        if (playImmediately) {
          videoPlayer.loadVideoById(videoId);
        }
      } else {
        console.log("No videos found for the query:", query);
      }
    })
    .catch((error) => {
      console.error("Error fetching YouTube data:", error);
    });
}

// Spotify Search
async function spotifySearch() {
  const query = document.getElementById("query").value;
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&q=${query}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  const data = await response.json();
  if (data.tracks && data.tracks.items) {
    displaySearchResults(data.tracks.items);
  } else {
    console.log("No tracks found");
  }
}

// Show Queue
let isQVisible = false;
// Show Queue
function toggleQueue() {
  if (isQVisible) {
    hideQ();
  } else {
    showQ();
  }
}

function showQ() {
  const queueElement = document.getElementById("queue");
  const queueContainer = document.getElementById("queue-container");
  queueElement.innerHTML = queue
    .map(
      (track, index) => `
    <div class="queue-item" onclick="playTrackFromQueue(${index})">
      <img src="${track.imageUrl}" alt="Album Artwork" class="queue-item-thumbnail">
      <div class="queue-item-details">
        ${track.title} - ${track.artist}<br>
        ${index === 0 ? formatTime(videoPlayer.getCurrentTime()) : ""}
      </div>
    </div>`
    )
    .join("");
  queueContainer.classList.remove("queue-hidden");
  queueContainer.classList.add("queue-shown");
  isQVisible = true;
}



function hideQ() {
  const queueElement = document.getElementById("queue");
const queueContainer = document.getElementById("queue-container");
  queueContainer.classList.remove("queue-shown");
  queueContainer.classList.add("queue-hidden");
  isQVisible = false;
}

document.addEventListener('DOMContentLoaded', (event) => {
    const showQueueButton = document.getElementById('showQueueButton');
    if (showQueueButton) {
        showQueueButton.addEventListener('click', toggleQueue);
    }
});



function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
function seekVideo(value) {
  const duration = videoPlayer.getDuration();
  const seekTo = (value / 100) * duration;
  videoPlayer.seekTo(seekTo, true);
}

function updateProgressBar() {
  const duration = videoPlayer.getDuration();
  const currentTime = videoPlayer.getCurrentTime();
  const progress = (currentTime / duration) * 100;
  document.getElementById("progressBar").value = progress;

  if (videoPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
    requestAnimationFrame(updateProgressBar);
  }
}





function playTrackFromQueue(index) {
  currentTrack = queue[index];
  updateUIForCurrentTrack();

  const youtubeQuery = `${currentTrack.title} ${currentTrack.artist} official video`;
  youtubeSearch(youtubeQuery, true);

  // Remove all tracks before the selected track from the queue
  queue = queue.slice(index);
}


// Display Spotify Search Results
function displaySearchResults(tracks) {
  const searchResultsDiv = document.getElementById("search-results");
  searchResultsDiv.innerHTML = "";
  tracks.forEach((track) => {
    const trackDiv = document.createElement("div");
    trackDiv.className = "search-result";
    trackDiv.innerHTML = `${track.name} - ${track.artists[0].name}`;
    trackDiv.onclick = () => {
      update(track);
      getSimilarSongsAndQueue(track);
    };
    searchResultsDiv.appendChild(trackDiv);
  });
}
// Update Function
function update(track) {
  originalTrack = track; // Store the original track
  const youtubeQuery = `${track.name} ${track.artists[0].name} official video`;
  youtubeSearch(youtubeQuery, true);
  currentTrack = track;
  hide();

  // Set album artwork
  const albumArtwork = document.getElementById("album-artwork");
  const showQueueButton = document.getElementById("showQueueButton"); // Assuming the ID of your "Show Queue" button is "show-queue-button"

  if (
    albumArtwork &&
    track.album &&
    track.album.images &&
    track.album.images[0]
  ) {
    const imageUrl = track.album.images[0].url;
    albumArtwork.src = imageUrl;
    showQueueButton.style.backgroundImage = `url('${imageUrl}')`; // Set the background image of the "Show Queue" button


    triggerGradientAnimation(imageUrl);
  }
}
async function triggerGradientAnimation(imageUrl) {

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Load the image from the URL
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
  await img.decode();

  // Get the main colors from the image
  const mainColors = await getMainColors(img);

  let gradients = Array.from({ length: 25 }, (v, i) => ({
    color: mainColors[i % mainColors.length],
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 500 + 200,
    blur: Math.random() * 200,
    xSpeed: Math.random() * 4 - 2,
    ySpeed: Math.random() * 4 - 2,
    radiusSpeed: Math.random() * 30 - 15,
    blurSpeed: Math.random() * 10 - 5,
    xSpeedChange: Math.random() * 0.2 - 0.1,
    ySpeedChange: Math.random() * 0.2 - 0.1,
    radiusSpeedChange: Math.random() * 0.5 - 0.25,
    blurSpeedChange: Math.random() * 0.2 - 0.1,
    maxRadius: Math.random() * 900 + 300,
    minRadius: Math.random() * 200 + 100
  }));

  function animateGradient() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gradients.forEach((gradient) => {
      gradient.x += gradient.xSpeed;
      gradient.y += gradient.ySpeed;
      gradient.radius += gradient.radiusSpeed;
      gradient.blur += gradient.blurSpeed;

      gradient.xSpeed += gradient.xSpeedChange;
      gradient.ySpeed += gradient.ySpeedChange;
      gradient.radiusSpeed += gradient.radiusSpeedChange;
      gradient.blurSpeed += gradient.blurSpeedChange;

      // Ensure radius oscillates between min and max values
      if (gradient.radius > gradient.maxRadius || gradient.radius < gradient.minRadius) {
        gradient.radiusSpeed *= -1;
      }

      const radialGradient = ctx.createRadialGradient(gradient.x, gradient.y, 0, gradient.x, gradient.y, gradient.radius);
      radialGradient.addColorStop(0, gradient.color);
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Boundary conditions to keep gradients within canvas
      if (gradient.x < 0 || gradient.x > canvas.width) gradient.xSpeed *= -1;
      if (gradient.y < 0 || gradient.y > canvas.height) gradient.ySpeed *= -1;
    });

    requestAnimationFrame(animateGradient);
  }

  animateGradient(); // Start the animation
}

async function getMainColors(img) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
    const colorCount = {};

    // Sample every 50th pixel for performance
    for (let i = 0; i < imageData.length; i += 200) {
      const color = `rgb(${imageData[i]}, ${imageData[i + 1]}, ${imageData[i + 2]})`;
      colorCount[color] = (colorCount[color] || 0) + 1;
    }

    // Sort by frequency and take the top 10 colors
    const mainColors = Object.keys(colorCount)
      .sort((a, b) => colorCount[b] - colorCount[a])
      .slice(0, 25);

    resolve(mainColors);
  });
}



// Get Similar Songs and Update Queue
async function getSimilarSongsAndQueue() {
  try {
    const recommendationsResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${originalTrack.id}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const recommendationsData = await recommendationsResponse.json();

    queue = [
      {
        title: currentTrack.name,
        artist: currentTrack.artists[0].name,
        imageUrl: currentTrack.album.images[0].url,
      },
      ...recommendationsData.tracks.map((track) => ({
        title: track.name,
        artist: track.artists[0].name,
        imageUrl: track.album.images[0].url,
      })),
    ];
  } catch (error) {
    console.error("Error fetching similar songs:", error);
  }
}
function onPlayerStateChange(event) {
  console.log("Player State Changed:", event.data);
  if (event.data === 0 && queue.length > 0) {
    playNextTrack();
  }
  if (event.data === YT.PlayerState.PLAYING) {
    updateProgressBar();
  }
}

let currentTrackIndex = 0; // Keep track of the current track index in the queue

async function playPreviousTrack() {
  if (currentTrackIndex > 0) {
    currentTrackIndex--;

    // Set the previous song as the current track
    currentTrack = queue[currentTrackIndex];

    // Update the UI with the new current track details
    updateUIForCurrentTrack();

    // Query YouTube and play the new current track
    const youtubeQuery = `${currentTrack.title} ${currentTrack.artist} official video`;
    youtubeSearch(youtubeQuery, true);
  }
}

async function playNextTrack() {
  // Remove the song that just ended from the queue
  queue.shift();

  // Set the next song as the current track
  currentTrack = queue[0];

  // Update the UI with the new current track details
  updateUIForCurrentTrack();

  // Get a new recommendation to add to the end of the queue
  const newRecommendation = await getNewRecommendation();
  if (newRecommendation) {
    queue.push(newRecommendation);
  }

  // Query YouTube and play the new current track
  const youtubeQuery = `${currentTrack.title} ${currentTrack.artist} official video`;
  youtubeSearch(youtubeQuery, true);
}

function updateUIForCurrentTrack() {
  const albumArtwork = document.getElementById("album-artwork");
  const showQueueButton = document.getElementById("showQueueButton");
  
  albumArtwork.src = currentTrack.imageUrl;
  showQueueButton.style.backgroundImage = `url('${currentTrack.imageUrl}')`;

  gradients = [];
  triggerGradientAnimation(currentTrack.imageUrl);
}

async function getNewRecommendation() {
  try {
    const recommendationsResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${originalTrack.id}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const recommendationsData = await recommendationsResponse.json();
    const newTrack = recommendationsData.tracks[0];
    return {
      title: newTrack.name,
      artist: newTrack.artists[0].name,
      imageUrl: newTrack.album.images[0].url,
    };
  } catch (error) {
    console.error("Error fetching new recommendation:", error);
    return null;
  }
}


// Function to toggle search bar visibility
let isPlaying = false;

let currentVolume = 0.5; // Default volume level

// Toggle between play and pause
function togglePlayPause() {
  if (videoPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
    pause();
  } else {
    resume();
  }
}



async function pause() {
  isPlaying = false;
  document.getElementById("playPause").textContent = " ► ";
  document.getElementById("playPause").style.color = "red";
  videoPlayer.pauseVideo(); // Pause the YouTube player
}

async function resume() {
  isPlaying = true;
  document.getElementById("playPause").textContent = " ⏸︎ ";
  document.getElementById("playPause").style.color = "white";
  document.getElementById("playPause").style.backgroundColor = "#ffffff";
  videoPlayer.playVideo(); // Play the YouTube player
}


async function nextTrack() {
  playNextTrack();
}

async function previousTrack() {
 playPreviousTrack();
}
let isVisible = false;

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
  const searchqueue = document.getElementById("searchqueue");
  searchqueue.style.zIndex = "800";
    searchContaine.style.display = "block";
    searchContainer.style.display = "block";
    overlay.style.zIndex = "349";
    overlay.style.display = "block";
    searchContainer.style.zIndex = "602";
    searchContaine.style.zIndex = "799";
     setTimeout(() => {
  searchContainer.style.opacity = "1";
   
  
 
  searchContaine.style.opacity = "1";
          }, 300);
  isVisible = true;
}

function hide() {
  const searchContainer = document.getElementById("search-container");
  const overlay = document.getElementById("overlay");
  const searchContaine = document.getElementById("query");
 searchContainer.style.opacity = "0";
    setTimeout(() => {
    searchContainer.style.zIndex = "-20";
    searchContaine.style.opacity = "0";
    searchContaine.style.zIndex = "-20";
    overlay.style.zIndex = "-10";
    searchContainer.style.zIndex = "-20";
        searchContainer.style.display = "none";
        searchContaine.style.display = "none";
 }, 300);
  // Initialize the YouTube
  isVisible = false;
}
window.onload = () => {
  initializeYouTube();
  initializeSpotify();

  // Add your animated gradient logic here
};
let disVisible = false;
function toggleBT() {
if (disVisible) {
hideD(); 
}
else { 
showDevices(); 
}
}
function hideD() {
const deviceList = document.getElementById('device-list');
deviceList.style.display = "none";
    deviceList.style.display = "-600";
    deviceList.style.visibility = "hidden";
disVisible = false; 
}

async function showDevices() {

  try {
    const response = await fetch('http://localhost:3000/devices');
    const devices = await response.json();
     const deviceList = document.getElementById('device-list');
	deviceList.style.display = "block";
          deviceList.style.visibility = "visible";

      deviceList.style.display = "701"
	disVisible = true;
    const list = document.getElementById('device-list');
    list.innerHTML = '';
    
    devices.forEach(device => {
      const listItem = document.createElement('li');
      listItem.textContent = device.name || 'Unnamed Device';
listItem.className = "search-result";
      
      listItem.addEventListener('click', () => {
        connectToDevice(device.id);
      });

      list.appendChild(listItem);
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
  }
}

async function connectToDevice(peripheralId) {
  try {
    const response = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ peripheralId })
    });
    
    const message = await response.text();
    console.log(message);
  } catch (error) {
    console.error('Error connecting to device:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh-button').addEventListener('click', fetchDevices);
});
