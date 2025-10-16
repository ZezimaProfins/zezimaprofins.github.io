const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const thumb = document.getElementById('thumb');
const timeEl = document.getElementById('time');

// Disable button until audio is ready
playPauseBtn.disabled = true;
playPauseBtn.style.opacity = 0.5;

// --- Initial volume (start very low for fade-in) ---
let targetVolume = 0.3; // desired final volume
audio.volume = 0;       // start muted

// When audio metadata is loaded
audio.addEventListener('loadedmetadata', () => {
  playPauseBtn.disabled = false;
  playPauseBtn.style.opacity = 1;
  updateTime();
});

// Toggle play/pause with fade-in
playPauseBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().catch(err => alert("Audio could not play: " + err.message));
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";

    // Fade in volume over 2 seconds
    let fadeDuration = 2000; // ms
    let fadeSteps = 20;
    let step = 0;
    let interval = fadeDuration / fadeSteps;
    let fadeInterval = setInterval(() => {
      step++;
      audio.volume = (targetVolume / fadeSteps) * step;
      if (step >= fadeSteps) clearInterval(fadeInterval);
    }, interval);

  } else {
    audio.pause();
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  }
});

// Update progress bar & time
audio.addEventListener('timeupdate', updateTime);

function updateTime() {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = percent + '%';
  thumb.style.left = percent + '%';

  const currentMinutes = Math.floor(audio.currentTime / 60);
  const currentSeconds = Math.floor(audio.currentTime % 60);
  const durationMinutes = Math.floor(audio.duration / 60);
  const durationSeconds = Math.floor(audio.duration % 60);
  timeEl.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2,'0')} / ${durationMinutes}:${durationSeconds.toString().padStart(2,'0')}`;
}

// --- Dragging thumb ---
let isDragging = false;

function setAudioTime(clientX) {
  const rect = progressContainer.getBoundingClientRect();
  let offsetX = clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));
  const newTime = (offsetX / rect.width) * audio.duration;
  audio.currentTime = newTime;
}

// Mouse events
thumb.addEventListener('mousedown', () => { isDragging = true; });
document.addEventListener('mouseup', () => { isDragging = false; });
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  setAudioTime(e.clientX);
});

// Touch events for mobile
thumb.addEventListener('touchstart', () => { isDragging = true; });
document.addEventListener('touchend', () => { isDragging = false; });
document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  if (e.touches.length > 0) setAudioTime(e.touches[0].clientX);
});

// Click or tap on progress bar to seek
progressContainer.addEventListener('click', (e) => {
  setAudioTime(e.clientX);
});
progressContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length > 0) setAudioTime(e.touches[0].clientX);
});

// Handle audio errors
audio.addEventListener('error', () => {
  playPauseBtn.disabled = true;
  playPauseBtn.style.opacity = 0.5;
  timeEl.textContent = 'File not found';
  alert('Error: Audio file could not be loaded.');
});
