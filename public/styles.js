// JavaScript code to handle toggling and search functionalities

document.addEventListener("DOMContentLoaded", function() {
  // Initial state is set to "paused"
  document.body.classList.add('paused');

  // Toggle between "Play" and "Pause" buttons
  const playButton = document.getElementById('play');
  const pauseButton = document.getElementById('pause');

  playButton.addEventListener('click', function() {
    document.body.classList.remove('paused');
    document.body.classList.add('playing');
  });

  pauseButton.addEventListener('click', function() {
    document.body.classList.remove('playing');
    document.body.classList.add('paused');
  });

  // Show/Hide search input and overlay
  const magnifyingGlass = document.getElementById('magnifying-glass');
  const queryInput = document.getElementById('query');
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  magnifyingGlass.addEventListener('click', function() {
    queryInput.style.display = 'block';
    document.body.appendChild(overlay);
    overlay.style.display = 'block';
  });

  // Hide search input and overlay when a search result is clicked
  const searchResults = document.getElementById('search-results');

  searchResults.addEventListener('click', function() {
    queryInput.style.display = 'none';
    overlay.style.display = 'none';
    document.body.removeChild(overlay);
  });
});
