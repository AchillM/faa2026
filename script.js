'use strict';

/* =====================================================================
   A FAIRYTALE WORLD FOR LISA — script.js
   ---------------------------------------------------------------------
   ✎ EDIT ONLY THE CONFIG BELOW. Everything on the page reads from here.
===================================================================== */
const CONFIG = {
  recipientName: 'Lisa',

  // Optional. Example: '6 November 2026'. Leave '' to hide.
  birthdayDate: '',

  birthdayMessage: {
    title: 'Happy Birthday',
    dear: 'Dear {name} ♡',
    subtitle: "Today, the stars shine a little brighter because it's your day.",
    wishDone: 'May your wish find its way to you.'
  },

  letterContent: {
    greeting: 'Dear {name},',
    paragraphs: [
      'Happy birthday to you!',
      'I hope today brings you countless little reasons to smile. I may not have the perfect words to describe everything, but I just want you to know that you deserve all the beautiful things this world has to offer.',
      'May you always find happiness in the smallest moments, courage in difficult days, and people who make you feel appreciated.',
      'Keep being yourself, keep chasing the things you love, and never forget how special your existence can be to the people around you.',
      'I hope this little surprise brings a smile to your face today.',
      'Once again, happy birthday, {name}. You deserve a beautiful year ahead.'
    ],
    closing: ['With a little warmth,', 'Someone who wishes you well. ♡']
  },

  wishes: [
    { title: 'Happiness', text: 'May your days be filled with genuine happiness and little moments worth remembering.' },
    { title: 'Dreams', text: "May you get closer to every dream you've been quietly working for." },
    { title: 'Strength', text: 'May you always find strength, even on the days that feel a little difficult.' },
    { title: 'Love', text: 'May you always be surrounded by people who appreciate you sincerely.' },
    { title: 'Beautiful Memories', text: "May this year give you stories you'll love telling someday." }
  ],

  // Add your real photos here, e.g.
  //   { src: 'photos/one.jpg', caption: 'Our first coffee' }
  // Leave empty to show soft placeholders (no fake memories).
  galleryImages: [],

  // ---- The mystery gift (all optional; placeholder is used when empty) ----
  giftName: '',                // e.g. 'Dinner at your favourite place'
  giftImage: '',               // e.g. 'images/gift.jpg'
  giftDescription: '',         // e.g. 'A cozy dinner, just the two of us.'
  giftMessage: '',             // special message shown in handwriting
  giftClaimDetails: '',        // e.g. 'Valid until 30 November. Just tell me which day suits you!'

  // ---- WhatsApp ----
  // Digits only, with country code, no "+" (e.g. '628123456789').
  // A number starting with 0 is treated as Indonesian (0812… → 62812…).
  // The number is never shown on the page.
  whatsappNumber: '',
  // {giftName} is replaced automatically.
  whatsappMessage:
    "Hey! I just opened my birthday mystery box! 🎁\n\nI got {giftName}!\n\nI'd love to claim my surprise. Thank you for making my birthday a little more magical! ♡",

  // ---- Audio ----
  // Path to a legal MP3 (e.g. 'audio/music-box.mp3'). If empty (or it fails
  // to load) a gentle built-in music-box melody is played instead.
  backgroundMusic: '',
  musicVolume: 0.35,
  // Optional per-effect files. Empty = built-in synthesized sound.
  soundEffects: {
    click: '', chime: '', flower: '', letter: '', wish: '', blow: '', open: '', whoosh: '', rattle: ''
  }
};

const GIFT_PLACEHOLDER = 'A little surprise, chosen especially for you.';

/* =====================================================================
   HELPERS
===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const body = document.body;
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wait = ms => sleep(reduced ? Math.min(ms * 0.25, 400) : ms);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAME = () => (CONFIG.recipientName || 'Lisa').trim();
const fill = t => String(t).replace(/\{name\}/gi, NAME());
const scrollBehavior = () => (reduced ? 'auto' : 'smooth');

/* =====================================================================
   SKY — stars, dust, fireflies, shooting stars (canvas)
===================================================================== */
const Sky = (() => {
  const cv = $('#sky');
  const g = cv.getContext('2d');
  let W = 0, H = 0, stars = [], dust = [], flies = [], shoots = [];
  let mode = 'night';
  const TARGETS = { night: { star: 1, fly: 0.25 }, dusk: { star: 0.7, fly: 0.6 }, garden: { star: 0.28, fly: 1 } };
  let target = { ...TARGETS.night };
  let level = { ...TARGETS.night };
  let warping = false, warpStart = 0;
  let introStart = performance.now(), introActive = !reduced;
  let shootOn = false, shootTimer = 0, energy = 1, last = performance.now();
  const sprites = {};

  function sprite(rgb) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.25, `rgba(${rgb},.45)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return c;
  }
  sprites.gold = sprite('255,226,150');
  sprites.pink = sprite('246,205,227');
  sprites.white = sprite('255,249,255');
  sprites.blue = sprite('169,201,237');

  function build() {
    const n = Math.round(Math.min(200, Math.max(60, (W * H) / 6800)));
    stars = Array.from({ length: n }, () => ({
      x: rand(0, W), y: rand(0, H), z: rand(0.2, 1), r: rand(0.4, 1.6),
      tw: rand(0, 6.28), ts: rand(0.8, 2.4), d: rand(0, 3200)
    }));
    const dn = Math.round(n * 0.4);
    dust = Array.from({ length: dn }, () => ({
      x: rand(0, W), y: rand(0, H), vy: -rand(5, 16), vx: rand(4, 12), r: rand(0.7, 1.9),
      a: rand(0.25, 0.75), ts: rand(0.6, 1.8), ph: rand(0, 6.28), c: pick(['gold', 'pink', 'white', 'blue'])
    }));
    flies = Array.from({ length: coarse ? 12 : 18 }, () => ({
      x: rand(0, W), y: rand(0, H), a: rand(0, 6.28), sp: rand(10, 28), r: rand(1.4, 2.6), ts: rand(0.8, 2), ph: rand(0, 6.28)
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) draw(performance.now(), 0);
  }

  function draw(now, dt) {
    g.clearRect(0, 0, W, H);
    const sec = now / 1000;
    level.star += (target.star - level.star) * Math.min(1, dt * 1.6);
    level.fly += (target.fly - level.fly) * Math.min(1, dt * 1.6);
    energy += (1 - energy) * Math.min(1, dt * 0.7);
    const t = now - introStart;
    if (introActive && t > 5400) introActive = false;

    // dust
    for (const d of dust) {
      if (!reduced) {
        d.y += d.vy * dt * energy;
        d.x += Math.sin(sec * 0.6 + d.ph) * d.vx * dt;
        if (d.y < -10) { d.y = H + 10; d.x = rand(0, W); }
      }
      const a = d.a * (0.6 + 0.4 * Math.sin(sec * d.ts + d.ph)) * Math.min(1, 0.25 + energy * 0.75);
      g.globalAlpha = Math.min(1, a);
      const s = d.r * 8 * (energy > 1.6 ? 1.35 : 1);
      g.drawImage(sprites[d.c], d.x - s / 2, d.y - s / 2, s, s);
    }

    // stars
    g.globalAlpha = 1;
    if (warping) {
      const k = Math.min(1, (now - warpStart) / 1500);
      const e = Math.pow(k, 2.4);
      const e0 = Math.pow(Math.max(0, k - 0.1), 2.4);
      const cx = W / 2, cy = H / 2;
      g.lineCap = 'round';
      for (const s of stars) {
        const x = s.x + (cx - s.x) * e, y = s.y + (cy - s.y) * e;
        const x0 = s.x + (cx - s.x) * e0, y0 = s.y + (cy - s.y) * e0;
        g.strokeStyle = `rgba(255,249,255,${Math.min(1, 0.35 + k)})`;
        g.lineWidth = s.r * (1 + k * 1.6);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke();
      }
    } else {
      g.fillStyle = '#FFF9FF';
      for (const s of stars) {
        if (!reduced) {
          s.y += s.z * 8 * dt;
          if (s.y > H + 4) { s.y = -4; s.x = rand(0, W); }
        }
        const appear = introActive ? Math.min(1, Math.max(0, (t - s.d) / 800)) : 1;
        const a = level.star * (0.55 + 0.45 * Math.sin(sec * s.ts + s.tw)) * appear;
        if (a < 0.02) continue;
        g.globalAlpha = a;
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill();
        if (s.r > 1.35) {
          g.globalAlpha = a * 0.6;
          g.fillRect(s.x - s.r * 3, s.y - 0.4, s.r * 6, 0.8);
          g.fillRect(s.x - 0.4, s.y - s.r * 3, 0.8, s.r * 6);
        }
      }
    }

    // fireflies
    for (const f of flies) {
      if (!reduced) {
        f.a += rand(-1, 1) * dt * 2.2;
        f.x += Math.cos(f.a) * f.sp * dt;
        f.y += Math.sin(f.a) * f.sp * dt - 2 * dt;
        if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
        if (f.y < -20) f.y = H + 20; if (f.y > H + 20) f.y = -20;
      }
      g.globalAlpha = level.fly * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(sec * f.ts + f.ph)));
      const s = f.r * 7;
      g.drawImage(sprites.gold, f.x - s / 2, f.y - s / 2, s, s);
    }

    // shooting stars
    if (shootOn && !reduced) {
      shootTimer -= dt;
      if (shootTimer <= 0) {
        shootTimer = rand(1.2, 3.2);
        shoots.push({ x: rand(W * 0.3, W * 1.05), y: rand(-10, H * 0.35), vx: -rand(520, 780), vy: rand(240, 360), life: 0, max: rand(0.7, 1.1) });
      }
    }
    for (let i = shoots.length - 1; i >= 0; i--) {
      const s = shoots[i];
      s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = s.life / s.max;
      if (k >= 1) { shoots.splice(i, 1); continue; }
      const len = 130, m = Math.hypot(s.vx, s.vy), nx = s.vx / m, ny = s.vy / m;
      const gx = g.createLinearGradient(s.x, s.y, s.x - nx * len, s.y - ny * len);
      gx.addColorStop(0, `rgba(255,249,255,${1 - k})`);
      gx.addColorStop(1, 'rgba(255,249,255,0)');
      g.globalAlpha = 1; g.strokeStyle = gx; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - nx * len, s.y - ny * len); g.stroke();
      g.globalAlpha = 1 - k;
      g.drawImage(sprites.white, s.x - 9, s.y - 9, 18, 18);
    }
    g.globalAlpha = 1;
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(now, dt);
    requestAnimationFrame(loop);
  }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  return {
    start() { resize(); if (!reduced) { last = performance.now(); requestAnimationFrame(loop); } },
    setMode(m) {
      mode = m; target = { ...(TARGETS[m] || TARGETS.night) };
      if (reduced) { level = { ...target }; draw(performance.now(), 0); }
    },
    warp() {
      return new Promise(res => {
        if (reduced) { res(); return; }
        warping = true; warpStart = performance.now();
        setTimeout(() => { warping = false; level.star = 0; res(); }, 1500);
      });
    },
    shooting(on) { shootOn = on; if (!on) shoots = []; },
    energize(v) { energy = Math.max(energy, v); },
    restartIntro() {
      introStart = performance.now(); introActive = !reduced;
      level = { ...TARGETS.night }; target = { ...TARGETS.night };
    }
  };
})();

/* =====================================================================
   FX — confetti & sparkles (canvas)
===================================================================== */
const Fx = (() => {
  const cv = $('#fx');
  const g = cv.getContext('2d');
  let W = 0, H = 0;
  const ps = [];
  let running = false, last = 0;
  const COLORS = ['#B8A5E8', '#F6CDE3', '#E8C77B', '#A9C9ED', '#FFF9FF'];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function add(p) {
    ps.push(p);
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }

  function star4(r) {
    g.beginPath();
    g.moveTo(0, -r);
    g.quadraticCurveTo(0, 0, r, 0);
    g.quadraticCurveTo(0, 0, 0, r);
    g.quadraticCurveTo(0, 0, -r, 0);
    g.quadraticCurveTo(0, 0, 0, -r);
    g.fill();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    g.clearRect(0, 0, W, H);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) { ps.splice(i, 1); continue; }
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = p.vy * Math.pow(p.drag, dt * 60) + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.life / p.max;
      g.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      g.fillStyle = p.color;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      if (p.type === 'rect') {
        g.scale(1, Math.abs(Math.cos(p.life * 6 + p.rot)));
        g.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      } else if (p.type === 'circle') {
        g.beginPath(); g.arc(0, 0, p.size / 2, 0, 6.283); g.fill();
      } else {
        star4(p.size);
      }
      g.restore();
    }
    g.globalAlpha = 1;
    if (ps.length) requestAnimationFrame(loop);
    else { running = false; g.clearRect(0, 0, W, H); }
  }

  return {
    confetti(count = 130, x = W / 2, y = H * 0.42) {
      const n = reduced ? Math.round(count / 4) : count;
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + rand(-1.35, 1.35), sp = rand(300, 900);
        add({
          type: pick(['rect', 'rect', 'circle', 'star']), x, y,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 900, drag: 0.985,
          rot: rand(0, 6.28), vr: rand(-8, 8), size: rand(6, 11), color: pick(COLORS), life: 0, max: rand(2.2, 3.6)
        });
      }
    },
    burst(x, y, n = 14) {
      const c = reduced ? Math.ceil(n / 3) : n;
      for (let i = 0; i < c; i++) {
        const ang = rand(0, 6.28), sp = rand(60, 230);
        add({
          type: 'star', x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 40, drag: 0.97,
          rot: 0, vr: rand(-2, 2), size: rand(3, 7), color: pick(['#E8C77B', '#FFF9FF', '#F6CDE3']), life: 0, max: rand(0.7, 1.3)
        });
      }
    },
    trail(x, y) {
      add({
        type: 'star', x: x + rand(-4, 4), y: y + rand(-4, 4), vx: rand(-14, 14), vy: rand(-26, -6), g: 24, drag: 0.98,
        rot: 0, vr: 1, size: rand(2, 4.5), color: pick(['#E8C77B', '#FFF9FF', '#F6CDE3']), life: 0, max: rand(0.5, 0.9)
      });
    }
  };
})();

/* =====================================================================
   SOUND — music + effects (file if provided, otherwise synthesized)
===================================================================== */
const Sound = (() => {
  let ctx = null, master = null, bus = null, musicG = null, sfxG = null, noiseBuf = null;
  let muted = false, musicWanted = false, timer = null, step = 0, nextT = 0, fileEl = null, level = 1, fadeTimer = null;
  const STEP = 0.36;
  const MEL = [
    76, 79, 84, 79, 76, 79, 86, 79,   74, 77, 83, 77, 74, 77, 84, 77,
    72, 76, 81, 76, 72, 76, 79, 76,   71, 74, 79, 74, 72, 76, 84, null
  ];
  const BASS = [48, 43, 45, 43];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const btn = $('#soundBtn');

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    bus = ctx.createGain(); bus.connect(master);
    const dly = ctx.createDelay(1); dly.delayTime.value = 0.3;
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const wet = ctx.createGain(); wet.gain.value = 0.38;
    bus.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(wet); wet.connect(master);
    musicG = ctx.createGain(); musicG.gain.value = 0.5 * level; musicG.connect(bus);
    sfxG = ctx.createGain(); sfxG.gain.value = 0.7; sfxG.connect(bus);
    return ctx;
  }

  function tone(freq, t, dur, vol, dest) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    const gn = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2.01;
    g2.gain.value = 0.25;
    o.connect(gn); o2.connect(g2); g2.connect(gn); gn.connect(dest);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function noise(dur, f0, f1, vol) {
    const t = ctx.currentTime;
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(gn); gn.connect(sfxG);
    src.start(t); src.stop(t + dur + 0.05);
  }

  function schedule() {
    if (!ctx || !musicWanted) return;
    while (nextT < ctx.currentTime + 0.6) {
      const i = step % MEL.length;
      const m = MEL[i];
      if (m) tone(mtof(m), nextT, 1.1, 0.16, musicG);
      if (i % 8 === 0) tone(mtof(BASS[i / 8]), nextT, 2.4, 0.12, musicG);
      if (i === 0) tone(mtof(100), nextT + 0.02, 1.6, 0.04, musicG);
      nextT += STEP; step++;
    }
  }

  function startSynth() {
    const c = ensure();
    if (!c || timer) return;
    nextT = c.currentTime + 0.1; step = 0;
    timer = setInterval(schedule, 120);
    schedule();
  }

  function synth(name) {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime + 0.01;
    const n = (m, dt, dur, v) => tone(mtof(m), t + dt, dur, v, sfxG);
    switch (name) {
      case 'click': n(88, 0, 0.3, 0.1); n(95, 0.05, 0.35, 0.07); break;
      case 'chime': [84, 88, 91, 96].forEach((m, i) => n(m, i * 0.1, 1.2, 0.13)); break;
      case 'flower': { const m = pick([84, 86, 88, 91, 93]); n(m, 0, 1, 0.12); n(m + 12, 0.08, 1, 0.07); break; }
      case 'letter': noise(0.4, 2500, 5000, 0.05); n(79, 0.25, 1, 0.1); n(84, 0.4, 1.1, 0.08); break;
      case 'wish': [79, 84, 88].forEach((m, i) => n(m, i * 0.14, 1.3, 0.12)); break;
      case 'blow': noise(0.9, 1200, 500, 0.16); break;
      case 'whoosh': noise(1.5, 200, 2400, 0.18); break;
      case 'rattle': for (let i = 0; i < 7; i++) n(pick([91, 95, 98]), i * 0.12, 0.25, 0.06); break;
      case 'open':
        [72, 76, 79, 84, 88, 91].forEach((m, i) => n
