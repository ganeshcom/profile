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
const musicAudio = document.getElementById('musicAudio');
const musicTrack = document.getElementById('musicTrack');
const musicStatus = document.getElementById('musicStatus');
const musicPlay = document.getElementById('musicPlay');
const musicPlayIcon = document.getElementById('musicPlayIcon');
const musicNext = document.getElementById('musicNext');
const musicTracks = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
];
let currentMusicTrack = 0;

function loadMusicTrack(shouldPlay = false) {
  musicAudio.src = musicTracks[currentMusicTrack];
  musicTrack.textContent = `Instrumental track ${String(currentMusicTrack + 1).padStart(2, '0')}`;
  musicStatus.textContent = `SOUNDHELIX • TRACK ${currentMusicTrack + 1} / ${musicTracks.length}`;
  if (shouldPlay) {
    musicAudio.play().catch(() => {
      musicStatus.textContent = 'TAP PLAY TO START';
    });
  }
}

musicPlay.addEventListener('click', () => {
  if (musicAudio.paused) {
    if (!musicAudio.src) loadMusicTrack();
    musicAudio.play().catch(() => {
      musicStatus.textContent = 'MUSIC COULD NOT START';
    });
  } else {
    musicAudio.pause();
  }
});

musicNext.addEventListener('click', () => {
  const shouldPlay = !musicAudio.paused;
  currentMusicTrack = (currentMusicTrack + 1) % musicTracks.length;
  loadMusicTrack(shouldPlay);
});

musicAudio.addEventListener('play', () => {
  musicPlayer.classList.add('is-playing');
  musicPlay.setAttribute('aria-label', 'Pause music');
  musicPlay.title = 'Pause music';
  musicPlayIcon.textContent = '❚❚';
});

musicAudio.addEventListener('pause', () => {
  musicPlayer.classList.remove('is-playing');
  musicPlay.setAttribute('aria-label', 'Play music');
  musicPlay.title = 'Play music';
  musicPlayIcon.textContent = '▶';
});

musicAudio.addEventListener('ended', () => {
  currentMusicTrack = (currentMusicTrack + 1) % musicTracks.length;
  loadMusicTrack(true);
});

loadMusicTrack(true);
