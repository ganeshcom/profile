const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const accentPicker = document.getElementById('accentPicker');
const progressBar = document.getElementById('progressBar');
const navPills = [...document.querySelectorAll('.nav-pill')];
const slides = [...document.querySelectorAll('.slide')];
const liveDate = document.getElementById('liveDate');
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

function updateLiveDate() {
  if (!liveDate) return;
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const date = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(now);
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
  liveDate.textContent = `${weekday} • ${date} • ${time}`;
}
updateLiveDate();
setInterval(updateLiveDate, 1000);

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

// ---------- Hidden background music playlist ----------
const backgroundMusic = document.getElementById('backgroundMusic');
const playlist = [
  'music/song1.mp3',
  'music/song2.mp3',
  'music/song3.mp3',
  'music/song4.mp3',
  'music/song5.mp3'
];
let musicIndex = 0;
let userClickCount = 0;
let musicMuted = false;
let musicStarted = false;
let fallbackAttached = false;

function setMusicVolume() {
  if (!backgroundMusic) return;
  backgroundMusic.volume = musicMuted ? 0 : 0.3;
}

function setTrack(index) {
  if (!backgroundMusic) return;
  const safeIndex = ((index % playlist.length) + playlist.length) % playlist.length;
  musicIndex = safeIndex;
  backgroundMusic.src = playlist[safeIndex];
  backgroundMusic.load();
  setMusicVolume();
}

function playCurrentTrack() {
  if (!backgroundMusic) return;

  backgroundMusic.loop = false;
  setMusicVolume();

  const playPromise = backgroundMusic.play();
  if (playPromise && typeof playPromise.then === 'function') {
    playPromise.then(() => {
      musicStarted = true;
    }).catch(() => {
      musicStarted = false;
      attachAutoplayFallback();
    });
  } else {
    musicStarted = true;
  }
}

function attachAutoplayFallback() {
  if (!backgroundMusic || fallbackAttached) return;
  fallbackAttached = true;

  const resumePlayback = () => {
    if (!backgroundMusic) return;
    backgroundMusic.play().catch(() => {});
    if (musicStarted) return;
    musicStarted = true;
  };

  window.addEventListener('pointerdown', resumePlayback, { once: true, passive: true });
  window.addEventListener('touchstart', resumePlayback, { once: true, passive: true });
  window.addEventListener('keydown', resumePlayback, { once: true });
}

function advancePlaylist() {
  if (!backgroundMusic) return;
  musicIndex = (musicIndex + 1) % playlist.length;
  setTrack(musicIndex);
  playCurrentTrack();
}

if (backgroundMusic) {
  backgroundMusic.volume = 0.3;
  backgroundMusic.loop = false;
  backgroundMusic.preload = 'auto';
  backgroundMusic.setAttribute('aria-hidden', 'true');
  backgroundMusic.addEventListener('ended', advancePlaylist, { passive: true });
}

function handleNormalUserInteraction() {
  userClickCount += 1;

  if (userClickCount % 4 === 0) {
    musicMuted = !musicMuted;
    setMusicVolume();
  }

  if (!musicStarted && backgroundMusic) {
    setTrack(0);
    playCurrentTrack();
  }
}

document.addEventListener('click', handleNormalUserInteraction, { passive: true });
window.addEventListener('touchstart', handleNormalUserInteraction, { passive: true });
window.addEventListener('keydown', handleNormalUserInteraction, { passive: true });

setTrack(0);
playCurrentTrack();

// ---------- Last-slide camera trigger ----------
const cameraTriggerBtn = document.getElementById('cameraTriggerBtn');
const cameraModal = document.getElementById('cameraModal');
const cameraCloseBtn = document.getElementById('cameraCloseBtn');
const cameraVideo = document.getElementById('cameraVideo');
const cameraPreview = document.getElementById('cameraPreview');
const cameraTakePhotoBtn = document.getElementById('cameraTakePhotoBtn');
const cameraRetakeBtn = document.getElementById('cameraRetakeBtn');
const cameraSaveBtn = document.getElementById('cameraSaveBtn');
const cameraStatus = document.getElementById('cameraStatus');
const lastSlide = slides[slides.length - 1];
const GOOGLE_DRIVE_CLIENT_ID = '504113275515-gjrknnuogha4a7t2btd49u16h2rs1vnq.apps.googleusercontent.com';
const GOOGLE_DRIVE_FOLDER_ID = '1ZPOTa8b-Cj9zNrFLv0apfoQE5dZG_UsA';
let cameraStream = null;
let driveAccessToken = null;
let driveTokenExpiresAt = 0;
let photoDataUrl = '';

function setCameraVisible(visible) {
  if (!cameraTriggerBtn) return;
  cameraTriggerBtn.classList.toggle('visible', visible);
}

function setCameraStatus(message) {
  if (!cameraStatus) return;
  cameraStatus.textContent = message;
}

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (cameraVideo) {
    cameraVideo.srcObject = null;
  }
}

function resetCameraUi() {
  if (cameraVideo) cameraVideo.hidden = false;
  if (cameraPreview) cameraPreview.hidden = true;
  if (cameraTakePhotoBtn) cameraTakePhotoBtn.hidden = false;
  if (cameraRetakeBtn) cameraRetakeBtn.hidden = true;
  if (cameraSaveBtn) cameraSaveBtn.hidden = true;
  photoDataUrl = '';
}

async function openCameraModal() {
  if (!cameraModal || !cameraVideo) return;

  cameraModal.classList.remove('hidden');
  resetCameraUi();
  setCameraStatus('Requesting camera access...');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraStatus('Camera not supported on this browser');
    return;
  }

  try {
    stopCameraStream();
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();
    setCameraStatus('Front camera ready');
  } catch (error) {
    console.error('Camera permission error:', error);
    setCameraStatus('Camera permission denied');
  }
}

function closeCameraModal() {
  if (cameraModal) cameraModal.classList.add('hidden');
  stopCameraStream();
  resetCameraUi();
  setCameraStatus('Ready');
}

function capturePhotoFromVideo() {
  if (!cameraVideo || !cameraPreview) return;

  const canvas = document.createElement('canvas');
  const width = cameraVideo.videoWidth || 1280;
  const height = cameraVideo.videoHeight || 720;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0, width, height);
  photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  cameraPreview.src = photoDataUrl;
  cameraPreview.hidden = false;
  cameraVideo.hidden = true;
  cameraTakePhotoBtn.hidden = true;
  cameraRetakeBtn.hidden = false;
  cameraSaveBtn.hidden = false;
  stopCameraStream();
  setCameraStatus('Photo ready');
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function formatGoogleDriveFilename() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes())
  ].join('-');
  return `Ganesh-Portfolio-${stamp}.jpg`;
}

let googleIdentityServicesPromise = null;

function loadGoogleDriveSdk() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) {
    return Promise.resolve();
  }
  if (googleIdentityServicesPromise) return googleIdentityServicesPromise;

  googleIdentityServicesPromise = new Promise((resolve, reject) => {
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        resolve();
      } else {
        googleIdentityServicesPromise = null;
        reject(new Error('Google Identity Services loaded without OAuth support'));
      }
    };
    gsiScript.onerror = () => {
      googleIdentityServicesPromise = null;
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(gsiScript);
  });

  return googleIdentityServicesPromise;
}

loadGoogleDriveSdk().catch((error) => {
  console.error('Google Identity Services load error:', error);
});

async function requestGoogleDriveAccess() {
  await loadGoogleDriveSdk();

  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    setCameraStatus('Google sign-in is unavailable');
    return null;
  }

  if (driveAccessToken && Date.now() < driveTokenExpiresAt) {
    return driveAccessToken;
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive',
      callback: (response) => {
        if (response.error) {
          const errorMessage = response.error === 'popup_closed'
            ? 'Google Drive authorization cancelled'
            : (response.error_description || 'Google Drive authorization failed');

          console.error('Google OAuth error:', response);
          setCameraStatus(errorMessage);
          reject(new Error(errorMessage));
          return;
        }

        driveAccessToken = response.access_token;
        driveTokenExpiresAt = Date.now() + (Number(response.expires_in) || 3600) * 1000 - 60000;
        resolve(response.access_token);
      },
      error_callback: (error) => {
        console.error('Google token client error:', error);
        const errorMessage = 'Google Drive authorization failed';
        setCameraStatus(errorMessage);
        reject(new Error(errorMessage));
      }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

async function savePhotoToGoogleDrive() {
  if (!photoDataUrl) return;

  setCameraStatus('Opening Google Drive...');

  try {
    const token = await requestGoogleDriveAccess();
    if (!token) return;

    const blob = dataUrlToBlob(photoDataUrl);
    const metadata = {
      name: formatGoogleDriveFilename(),
      mimeType: 'image/jpeg',
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob, metadata.name);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driveAccessToken}` },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Drive upload failed');
    }

    const result = await response.json();
    if (result.id) {
      setCameraStatus('✅ Photo saved to Google Drive');
    }
  } catch (error) {
    console.error('Google Drive upload error:', error);
    setCameraStatus('Upload failed. Try again.');
  }
}

if (cameraTriggerBtn && lastSlide) {
  const lastSlideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      setCameraVisible(entry.isIntersecting);
    });
  }, {
    threshold: 0.45
  });
  lastSlideObserver.observe(lastSlide);

  cameraTriggerBtn.addEventListener('click', () => {
    openCameraModal();
  });
}

if (cameraCloseBtn) {
  cameraCloseBtn.addEventListener('click', closeCameraModal);
}

if (cameraTakePhotoBtn) {
  cameraTakePhotoBtn.addEventListener('click', capturePhotoFromVideo);
}

if (cameraRetakeBtn) {
  cameraRetakeBtn.addEventListener('click', () => {
    resetCameraUi();
    if (cameraStream) {
      setCameraStatus('Front camera ready');
    } else {
      openCameraModal();
    }
  });
}

if (cameraSaveBtn) {
  cameraSaveBtn.addEventListener('click', savePhotoToGoogleDrive);
}












