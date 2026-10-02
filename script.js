const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const accentPicker = document.getElementById('accentPicker');
const progressBar = document.getElementById('progressBar');
const navPills = [...document.querySelectorAll('.nav-pill')];
const slides = [...document.querySelectorAll('.slide')];
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

// ---------- Theme controls ----------
const savedTheme = localStorage.getItem('ganesh-theme');
const savedAccent = localStorage.getItem('ganesh-accent');
if (savedTheme) root.dataset.theme = savedTheme;
if (savedAccent) {
  root.dataset.theme = 'custom';
  root.style.setProperty('--accent', savedAccent);
  accentPicker.value = savedAccent;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(x => x + x).join('') : clean;
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function setCustomAccent(hex) {
  const {r, g, b} = hexToRgb(hex);
  root.dataset.theme = 'custom';
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-rgb', `${r},${g},${b}`);
}
if (savedAccent) setCustomAccent(savedAccent);

themeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = themeMenu.classList.toggle('open');
  themeBtn.setAttribute('aria-expanded', String(open));
  themeMenu.setAttribute('aria-hidden', String(!open));
});

document.querySelectorAll('[data-theme]').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-rgb');
    root.dataset.theme = theme;
    localStorage.setItem('ganesh-theme', theme);
    localStorage.removeItem('ganesh-accent');
    accentPicker.value = getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff304f';
  });
});

accentPicker.addEventListener('input', (e) => {
  const accent = e.target.value;
  setCustomAccent(accent);
  localStorage.setItem('ganesh-accent', accent);
  localStorage.setItem('ganesh-theme', 'custom');
});

document.addEventListener('click', (e) => {
  if (!themeMenu.contains(e.target) && e.target !== themeBtn) {
    themeMenu.classList.remove('open');
    themeBtn.setAttribute('aria-expanded', 'false');
    themeMenu.setAttribute('aria-hidden', 'true');
  }
});

// ---------- Scroll progress + section state ----------
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navPills.forEach(p => p.classList.toggle('active', p.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { threshold: 0.45 });
slides.forEach(slide => sectionObserver.observe(slide));

// ---------- Reveal animations ----------
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ---------- Mouse tracker + micro glow ----------
let mx = window.innerWidth / 2;
let my = window.innerHeight / 2;
let rx = mx, ry = my;
window.addEventListener('pointermove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursorDot.style.left = `${mx}px`;
  cursorDot.style.top = `${my}px`;
}, { passive: true });
function animateCursor() {
  rx += (mx - rx) * 0.16;
  ry += (my - ry) * 0.16;
  cursorRing.style.left = `${rx}px`;
  cursorRing.style.top = `${ry}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, input').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-big'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-big'));
});

// ---------- Tiny light sparks ----------
const sparkField = document.getElementById('spark-field');
for (let i = 0; i < 48; i++) {
  const s = document.createElement('span');
  s.className = 'spark';
  s.style.left = `${Math.random() * 100}%`;
  s.style.top = `${Math.random() * 100}%`;
  s.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
  s.style.animationDuration = `${(1.8 + Math.random() * 2.8).toFixed(2)}s`;
  sparkField.appendChild(s);
}

// ---------- Scroll with keyboard without hijacking normal wheel ----------
window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown'].includes(e.key)) {
    e.preventDefault();
    window.scrollBy({ top: window.innerHeight * 0.86, behavior: 'smooth' });
  }
  if (['ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault();
    window.scrollBy({ top: -window.innerHeight * 0.86, behavior: 'smooth' });
  }
  if (e.key === 'Home') window.scrollTo({ top: 0, behavior: 'smooth' });
  if (e.key === 'End') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

// ---------- Automatic background music ----------
const MusicAudioContext = window.AudioContext || window.webkitAudioContext;
const musicNotes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 523.25];
const musicChords = [
  [130.81, 164.81, 196],
  [110, 130.81, 164.81],
  [174.61, 220, 261.63],
  [196, 246.94, 293.66]
];
let musicContext;
let musicOutput;
let musicTimer;
let musicPhrase = 0;
let musicPlaying = false;
let musicStarting = false;
let musicRequest = 0;

function playMusicNote(frequency, startTime, duration, volume, type = 'triangle') {
  const oscillator = musicContext.createOscillator();
  const envelope = musicContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(envelope);
  envelope.connect(musicOutput);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function playMusicPhrase() {
  if (!musicPlaying) return;
  const phraseDuration = musicNotes.length * 0.48;
  const startTime = musicContext.currentTime + 0.05;
  const chord = musicChords[musicPhrase++ % musicChords.length];

  chord.forEach(frequency => playMusicNote(frequency, startTime, phraseDuration, 0.025, 'sine'));
  musicNotes.forEach((frequency, index) => {
    const noteTime = startTime + index * 0.48;
    playMusicNote(frequency, noteTime, 0.4, 0.07);
    if (index % 2 === 0) playMusicNote(65.41, noteTime, 0.18, 0.08, 'sine');
  });

  musicTimer = window.setTimeout(playMusicPhrase, phraseDuration * 1000);
}

async function startBackgroundMusic(userActivated = false) {
  if (musicPlaying || (musicStarting && !userActivated) || !MusicAudioContext) return;
  musicStarting = true;
  const request = ++musicRequest;

  try {
    if (!musicContext) {
      musicContext = new MusicAudioContext();
      musicOutput = musicContext.createGain();
      musicOutput.gain.value = 0.18;
      musicOutput.connect(musicContext.destination);
    }
    await musicContext.resume();
    if (request !== musicRequest || musicContext.state !== 'running') return;
    musicStarting = false;
    musicPlaying = true;
    playMusicPhrase();
  } catch {
    if (request === musicRequest) musicStarting = false;
  }
}

document.addEventListener('click', () => startBackgroundMusic(true), { once: true });
startBackgroundMusic();


