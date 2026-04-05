// ==== ART CRIMES — Sound Effects (Web Audio API) ====
// All sounds are synthesized — no external audio files needed.

let sfxCtx = null;
let sfxEnabled = true;
let sfxVolume = 0.5; // 0-1

function getCtx() {
  if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
  return sfxCtx;
}

function isEnabled() {
  return sfxEnabled;
}

export function setSfxEnabled(on) {
  sfxEnabled = on;
  localStorage.setItem('artcrimes_sfx', on ? '1' : '0');
}

export function getSfxEnabled() {
  return sfxEnabled;
}

export function initSfx() {
  const saved = localStorage.getItem('artcrimes_sfx');
  sfxEnabled = saved !== '0'; // default on
  const savedVol = localStorage.getItem('artcrimes_sfx_vol');
  if (savedVol !== null) sfxVolume = parseInt(savedVol) / 100;
}

export function setSfxVolume(v) {
  sfxVolume = v;
  localStorage.setItem('artcrimes_sfx_vol', Math.round(v * 100));
}

export function getSfxVolume() {
  return sfxVolume;
}

// ── Submit: stamp/splat — short burst with frequency sweep down ──
export function playSubmitSound() {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(sfxVolume * 0.6, now);
  gain.gain.exponentialDecayTo?.(0.001, now + 0.3);
  gain.gain.setValueAtTime(sfxVolume * 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  // Low thud
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.35);

  // Noise burst for "splat" texture
  const bufLen = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(sfxVolume * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  noise.connect(noiseGain);
  noise.start(now);
  noise.stop(now + 0.15);
}

// ── Like: gentle "ding" — short high sine with fast decay ──
export function playLikeSound() {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(sfxVolume * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.4);
}

// ── Undo: soft "pop" — very short sine blip ──
export function playUndoSound() {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(sfxVolume * 0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.1);
}

// ── Clear: "whoosh" — noise burst with frequency sweep ──
export function playClearSound() {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Filtered noise sweep
  const bufLen = ctx.sampleRate * 0.4;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(sfxVolume * 0.4, now);
  gain.gain.setValueAtTime(sfxVolume * 0.4, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.4);
}

// ── Streak milestone: triumphant major chord ──
export function playStreakSound() {
  if (!isEnabled()) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // C major chord: C4, E4, G4, C5
  const freqs = [261.63, 329.63, 392.00, 523.25];
  freqs.forEach((freq, i) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now + i * 0.06);
    gain.gain.linearRampToValueAtTime(sfxVolume * 0.25, now + i * 0.06 + 0.05);
    gain.gain.setValueAtTime(sfxVolume * 0.25, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(now + i * 0.06);
    osc.stop(now + 1.0);
  });
}
