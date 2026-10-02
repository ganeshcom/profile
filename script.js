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

// ---------- Music player ----------
const musicPlayer = document.getElementById('musicPlayer');
const musicTrack = document.getElementById('musicTrack');
const musicStatus = document.getElementById('musicStatus');
const musicPlay = document.getElementById('musicPlay');
const musicPlayIcon = document.getElementById('musicPlayIcon');
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392, 523.25];
let musicContext;
let musicMaster;
let droneOscillators = [];
let phraseTimer;
let phraseCount = 0;
let musicPlaying = false;
let musicStarting = false;
let musicRequestId = 0;

function setMusicButton(playing) {
  musicPlayer.classList.toggle('is-playing', playing);
  musicPlay.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} background music`);
  musicPlay.title = `${playing ? 'Pause' : 'Play'} background music`;
  musicPlayIcon.textContent = playing ? '❚❚' : '▶';
}

function playTone(frequency, startTime, duration, volume, type = 'triangle') {
  const oscillator = musicContext.createOscillator();
  const envelope = musicContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(volume, startTime + 0.035);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(envelope);
  envelope.connect(musicMaster);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playPhrase() {
  if (!musicPlaying) return;
  const phrase = phraseCount++ % 2 ? [...melody].reverse() : melody;
  const startTime = musicContext.currentTime + 0.04;
  phrase.forEach((frequency, index) => {
    const noteTime = startTime + index * 0.36;
    playTone(frequency, noteTime, 0.31, 0.075);
    if (index % 2 === 0) playTone(98, noteTime, 0.12, 0.11, 'sine');
  });
  phraseTimer = window.setTimeout(playPhrase, phrase.length * 360);
}

function startDrone() {
  droneOscillators = [130.81, 196].map((frequency, index) => {
    const oscillator = musicContext.createOscillator();
    const volume = musicContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    volume.gain.value = index === 0 ? 0.18 : 0.1;
    oscillator.connect(volume);
    volume.connect(musicMaster);
    oscillator.start();
    return oscillator;
  });
}

async function startBackgroundMusic(userActivated = false) {
  if (musicPlaying || (musicStarting && !userActivated)) return;
  if (!AudioContextClass) {
    musicStatus.textContent = 'AUDIO IS NOT AVAILABLE IN THIS BROWSER';
    return;
  }

  musicStarting = true;
  const requestId = ++musicRequestId;
  try {
    if (!musicContext) {
      musicContext = new AudioContextClass();
      musicMaster = musicContext.createGain();
      musicMaster.gain.value = 0.0001;
      musicMaster.connect(musicContext.destination);
    }
    await musicContext.resume();
    if (requestId !== musicRequestId) return;
    musicPlaying = true;
    musicStarting = false;
    musicMaster.gain.cancelScheduledValues(musicContext.currentTime);
    musicMaster.gain.setTargetAtTime(0.2, musicContext.currentTime, 0.35);
    startDrone();
    setMusicButton(true);
    musicStatus.textContent = 'INSTRUMENTAL • PLAYING';
    playPhrase();
  } catch {
    if (requestId === musicRequestId) {
      musicStarting = false;
      musicStatus.textContent = 'TAP PLAY TO START';
    }
  }
}

function pauseBackgroundMusic() {
  musicRequestId++;
  musicStarting = false;
  musicPlaying = false;
  window.clearTimeout(phraseTimer);
  if (musicContext && musicMaster) {
    musicMaster.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.08);
    droneOscillators.forEach(oscillator => oscillator.stop(musicContext.currentTime + 0.3));
    droneOscillators = [];
  }
  setMusicButton(false);
  musicStatus.textContent = 'PAUSED';
}

musicPlay.addEventListener('click', () => {
  if (musicPlaying) pauseBackgroundMusic();
  else startBackgroundMusic(true);
});

document.addEventListener('pointerdown', event => {
  if (!(event.target instanceof Element) || !event.target.closest('#musicPlay')) startBackgroundMusic(true);
}, { once: true });
document.addEventListener('keydown', event => {
  if (!(event.target instanceof Element) || !event.target.closest('#musicPlay')) startBackgroundMusic(true);
}, { once: true });

musicStatus.textContent = 'TRYING AUTO-PLAY...';
startBackgroundMusic();
