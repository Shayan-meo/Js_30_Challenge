function playSound(code) {
  const audio = document.querySelector(`audio[data-key="${code}"]`);
  const key = document.querySelector(`div[data-key="${code}"]`);
  if (!audio) return;
  key.classList.add('playing');
  audio.currentTime = 0;
  audio.play();
}

function removeTransition(e) {
  if (e.propertyName !== 'transform') return;
  e.target.classList.remove('playing');
}

document.querySelectorAll('.key').forEach(key =>
  key.addEventListener('transitionend', removeTransition)
);

window.addEventListener('keydown', (e) => playSound(e.code));

document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', () => playSound(key.dataset.key));
});

// --- AI Voice (Web Speech API) ---
const VOICE_MAP = [
  { keywords: ['clap', 'claps', 'clip'],              code: 'KeyA' },
  { keywords: ['hi hat', 'hihat', 'high hat', 'hat'], code: 'KeyS' },
  { keywords: ['kick', 'kik', 'bass'],                code: 'KeyD' },
  { keywords: ['open', 'open hat', 'openhat'],        code: 'KeyF' },
  { keywords: ['boom', 'bomb', 'bum'],                code: 'KeyG' },
  { keywords: ['ride', 'right'],                      code: 'KeyH' },
  { keywords: ['snare', 'snar', 'sneer'],             code: 'KeyJ' },
  { keywords: ['tom', 'tum'],                         code: 'KeyK' },
  { keywords: ['tink', 'think', 'tin'],               code: 'KeyL' },
];

const statusEl  = document.getElementById('status');
const heardEl   = document.getElementById('last-heard');
const toggleBtn = document.getElementById('mic-toggle');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

function processTranscript(text) {
  heardEl.textContent = 'Heard: ' + text;
  const lower = text.toLowerCase();
  const fired = new Set();
  for (const entry of VOICE_MAP) {
    if (fired.has(entry.code)) continue;
    if (entry.keywords.some(k => lower.includes(k))) {
      playSound(entry.code);
      fired.add(entry.code);
    }
  }
}

function setupRecognition() {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    listening = true;
    statusEl.textContent = 'Mic: Listening…';
    toggleBtn.textContent = '🛑 Stop Voice';
  };

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const transcript = result[0].transcript.trim();
    if (!transcript) return;
    processTranscript(transcript);
  };

  recognition.onerror = (e) => {
    statusEl.textContent = 'Mic error: ' + e.error;
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      listening = false;
      toggleBtn.textContent = '🎤 Start Voice';
    }
  };

  recognition.onend = () => {
    if (listening) {
      try { recognition.start(); } catch (_) {}
    } else {
      statusEl.textContent = 'Mic: Off';
      toggleBtn.textContent = '🎤 Start Voice';
    }
  };
}

if (!SpeechRecognition) {
  statusEl.textContent = 'Browser voice not supported (use Chrome/Edge)';
  toggleBtn.disabled = true;
} else {
  setupRecognition();
  toggleBtn.addEventListener('click', () => {
    if (!listening) {
      try { recognition.start(); } catch (_) {}
    } else {
      listening = false;
      recognition.stop();
    }
  });
}
