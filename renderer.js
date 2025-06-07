const startBtn = document.getElementById('startBtn');
const progressBar = document.getElementById('progress-bar');
const focusTimeSlider = document.getElementById('focusTimeSlider');
const focusTimeValueDisplay = document.getElementById('focusTimeValue');
// const initialFocusTime = 5 * 60; // Removed, will be dynamic
let timer = 0; // Modified - will be set based on validated input from focusTimeInput
let currentSessionTotalSeconds = 0; // Added - to store the total duration of the current session in seconds
let interval = null;
const motivationalMessages = [
  "Keep at it!",
  "One step at a time...",
  "Focus on text now. Reward will come later.",
  "You're doing great!",
  "Stay focused, you've got this!",
  "Almost there, keep pushing!",
  "Put the music on and keep crushing it!"
];

function startTimer() {
  if (interval) return; // Timer is already running

  let focusMinutes = parseInt(focusTimeSlider.value, 10);

  if (isNaN(focusMinutes)) {
    focusMinutes = 25; // Default if input is not a number
  }

  // Clamp the value between 5 and 60
  focusMinutes = Math.max(1, Math.min(60, focusMinutes));
  focusTimeSlider.value = focusMinutes; // Update the slider position with the clamped value
  focusTimeValueDisplay.textContent = focusMinutes; // Also update the display

  currentSessionTotalSeconds = focusMinutes * 60;
  timer = currentSessionTotalSeconds; // Set the timer for the new session duration

  startBtn.disabled = true; // Disable start button during session
  startBtn.classList.add('start-btn-disabled'); // Add class for disabled styling
  if (motivationalMessages.length > 0) {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    startBtn.textContent = motivationalMessages[randomIndex];
  }
  progressBar.style.width = '0%'; // Reset progress bar for the new session

  interval = setInterval(() => {
    if (timer > 0) {
      timer--;
      // Calculate progress based on the current session's total seconds
      const progressPercentage = ((currentSessionTotalSeconds - timer) / currentSessionTotalSeconds) * 100;
      progressBar.style.width = progressPercentage + '%';
    } else { // Timer has reached 0
      clearInterval(interval);
      interval = null;
      startBtn.disabled = false; // Re-enable start button
      startBtn.classList.remove('start-btn-disabled'); // Remove class for disabled styling
      progressBar.style.width = '100%'; // Show session completed (full bar)
      startBtn.textContent = "Start Focus"; // Reset button text
      chimeSound.play().catch(error => console.error('Error playing chime sound:', error));
      // alert('Focus session complete!'); // Removed as per request
      // Timer is 0. currentSessionTotalSeconds holds the last session's duration.
      // These will be reset if startTimer is called again based on new input.
    }
  }, 1000);
}

startBtn.addEventListener('click', () => {
  if (startBtn.disabled) {
    // If button is disabled and clicked, show a motivational message on the button itself
    if (motivationalMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
      startBtn.textContent = motivationalMessages[randomIndex];
    }
  } else {
    // If button is not disabled, start the timer.
    // The button text is already "Start Focus" or will be reset when a previous session ends.
    startTimer();
  }
});

if (focusTimeSlider && focusTimeValueDisplay) {
  focusTimeValueDisplay.textContent = focusTimeSlider.value;
  focusTimeSlider.addEventListener('input', () => {
    focusTimeValueDisplay.textContent = focusTimeSlider.value;
  });
}

// Initialize progress bar state on load
if (progressBar) {
  progressBar.style.width = '0%';
}

const editor = document.getElementById('editor');
const soundToggle = document.getElementById('soundToggle');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const typeSound = new Audio('./assets/typewriter-key.m4a'); // Path relative to index.html

// New elements for modal settings
const settingsIcon = document.getElementById('settings-icon');
const settingsModalOverlay = document.getElementById('settings-modal-overlay');
const modalCloseBtn = document.querySelector('.modal-close-btn');
const chimeSound = new Audio('./assets/chime.mp3'); // Path relative to index.html

// Theme elements
const themeBasicRadio = document.getElementById('themeBasic');
const themeSkyRadio = document.getElementById('themeSky');
const themeNatureRadio = document.getElementById('themeNature');
let isSoundEnabled = soundToggle.checked;

soundToggle.addEventListener('change', () => {
  isSoundEnabled = soundToggle.checked;
});

editor.addEventListener('input', () => {
  if (!isSoundEnabled) {
    return;
  }
  // Ensure the sound can be replayed quickly
  if (typeSound.readyState >= 2) { // HAVE_CURRENT_DATA or more
    typeSound.currentTime = 0;
    typeSound.play().catch(error => {
      // console.error('Error playing sound:', error);
      // Autoplay might be prevented by the browser if no prior user interaction
      // on the page, though 'input' usually counts.
    });
  }
});

// Event listeners for settings modal
if (settingsIcon && settingsModalOverlay && modalCloseBtn) {
  settingsIcon.addEventListener('click', () => {
    settingsModalOverlay.classList.add('active');
  });

  modalCloseBtn.addEventListener('click', () => {
    settingsModalOverlay.classList.remove('active');
  });

  // Optional: Close modal if overlay (outside content) is clicked
  settingsModalOverlay.addEventListener('click', (event) => {
    if (event.target === settingsModalOverlay) { // Check if the click is on the overlay itself
      settingsModalOverlay.classList.remove('active');
    }
  });
}

saveBtn.addEventListener('click', async () => {
  const textContent = editor.value;
  try {
    const result = await window.electronAPI.saveText(textContent);
    if (result.success) {
      alert('File saved successfully!');
    } else if (result.filePath) {
      // This case implies success but filePath is provided for other reasons, still treat as success
      alert(`File saved successfully at: ${result.filePath}`);
    } else if (result.error) {
      alert(`Error saving file: ${result.error}`);
    } else if (!result.canceled) { // If not successful and not explicitly canceled, and no specific error message
      alert('Failed to save file. The operation may have been canceled or an unknown error occurred.');
    }
    // If result.canceled is true, the user closed the dialog, so no alert is needed.
  } catch (error) {
    console.error('Error invoking saveText:', error);
    alert(`An error occurred: ${error.message}`);
  }
});

if (loadBtn) {
  loadBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.loadText();
      if (result.success && typeof result.content === 'string') {
        editor.value = result.content;
        alert(`File loaded successfully: ${result.filePath}`);
      } else if (result.error) {
        alert(`Error loading file: ${result.error}`);
      } else if (!result.canceled) {
        // Handle cases where not explicitly canceled but also not successful without a specific error
        alert('Failed to load file. The operation may have been canceled or an unknown error occurred.');
      }
      // If result.canceled is true, do nothing as the user closed the dialog.
    } catch (error) {
      console.error('Error invoking loadText:', error);
      alert(`An error occurred while trying to load the file: ${error.message}`);
    }
  });
}

// --- Theme Functionality ---
function applyTheme(themeName) {
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundRepeat = 'no-repeat';

  if (themeName === 'sky') {
    document.body.style.backgroundImage = "url('./assets/images/sky.png')";
    document.body.style.backgroundColor = ''; // Clear background color if image is set
  } else if (themeName === 'nature') {
    document.body.style.backgroundImage = "url('./assets/images/trees.png')";
    document.body.style.backgroundColor = ''; // Clear background color if image is set
  } else { // Basic theme
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#f0f2f5'; // Default background color
  }
}

function setTheme(themeValue) {
  applyTheme(themeValue);
  localStorage.setItem('selectedTheme', themeValue);
  // Update radio button state (optional, but good for consistency if called externally)
  if (themeValue === 'basic') themeBasicRadio.checked = true;
  else if (themeValue === 'sky') themeSkyRadio.checked = true;
  else if (themeValue === 'nature') themeNatureRadio.checked = true;
}

// Event listeners for theme radio buttons
if (themeBasicRadio && themeSkyRadio && themeNatureRadio) {
  themeBasicRadio.addEventListener('change', () => {
    if (themeBasicRadio.checked) setTheme('basic');
  });
  themeSkyRadio.addEventListener('change', () => {
    if (themeSkyRadio.checked) setTheme('sky');
  });
  themeNatureRadio.addEventListener('change', () => {
    if (themeNatureRadio.checked) setTheme('nature');
  });
}

// Load saved theme on startup
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('selectedTheme') || 'basic';
  setTheme(savedTheme);

  // Listen for request from main process to get editor content before quitting
  if (window.electronAPI && typeof window.electronAPI.onEditorContentRequest === 'function') {
    window.electronAPI.onEditorContentRequest(() => {
      const currentContent = editor.value;
      if (typeof window.electronAPI.sendEditorContentResponse === 'function') {
        console.log('Renderer: Sending editor content to main process for save-on-quit.');
        window.electronAPI.sendEditorContentResponse(currentContent);
      } else {
        console.error('Renderer: sendEditorContentResponse is not available on electronAPI.');
      }
    });
  } else {
    console.error('Renderer: onEditorContentRequest is not available on electronAPI.');
  }

  // Ensure initial focus time slider value is displayed correctly
  if (focusTimeSlider && focusTimeValueDisplay) {
    focusTimeValueDisplay.textContent = focusTimeSlider.value;
  }
});
