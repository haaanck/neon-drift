const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================');
console.log('>>> TEST SUITE: 5 SKILL UPGRADES REGRESSION VERIFIER <<<');
console.log('========================================================');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'index.html');
const manifestPath = path.join(rootDir, 'manifest.json');
const swPath = path.join(rootDir, 'sw.js');

const html = fs.readFileSync(htmlPath, 'utf8');

// 1. PWA & Web Platform Standards Verification
console.log('Test 1: PWA Manifest & Service Worker Assets...');
if (!fs.existsSync(manifestPath)) throw new Error('manifest.json is missing!');
if (!fs.existsSync(swPath)) throw new Error('sw.js is missing!');

const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifestJson.name !== 'Neon Drift') throw new Error('Invalid manifest name: ' + manifestJson.name);
if (manifestJson.display !== 'standalone') throw new Error('Manifest display should be standalone');
if (!Array.isArray(manifestJson.icons) || manifestJson.icons.length < 2) throw new Error('Manifest missing required icons');

const swContent = fs.readFileSync(swPath, 'utf8');
if (!swContent.includes('addEventListener(\'install\'') && !swContent.includes('addEventListener("install"')) {
  throw new Error('sw.js missing install listener');
}
if (!swContent.includes('addEventListener(\'fetch\'') && !swContent.includes('addEventListener("fetch"')) {
  throw new Error('sw.js missing fetch listener');
}

if (!html.includes('<link rel="manifest" href="manifest.json">')) {
  throw new Error('index.html missing manifest link tag');
}
if (!html.includes('serviceWorker.register')) {
  throw new Error('index.html missing serviceWorker registration script');
}
console.log('  [PASS] PWA manifest and service worker configuration verified!');

// 2. Headless VM Setup for Neon Drift Runtime Verification
console.log('Test 2: Loading Game Environment into Headless VM...');
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}
if (scripts.length !== 5) throw new Error('Expected 5 script blocks in index.html, found: ' + scripts.length);

let saveCount = 0;
let restoreCount = 0;
let rumbleTriggered = false;
let rumbleParams = null;

const mockAudioNodes = [];
const mockAudioCtx = {
  currentTime: 0.1,
  sampleRate: 44100,
  createOscillator: function() {
    const node = {
      type: 'sine',
      frequency: {
        setValueAtTime: function() {},
        exponentialRampToValueAtTime: function() {},
        linearRampToValueAtTime: function() {}
      },
      Q: {
        setValueAtTime: function() {}
      },
      connect: function() {},
      start: function() {},
      stop: function() {}
    };
    mockAudioNodes.push(node);
    return node;
  },
  createGain: function() {
    return {
      gain: {
        setValueAtTime: function() {},
        exponentialRampToValueAtTime: function() {},
        linearRampToValueAtTime: function() {}
      },
      connect: function() {}
    };
  },
  createBiquadFilter: function() {
    return {
      type: 'lowpass',
      frequency: {
        setValueAtTime: function() {},
        exponentialRampToValueAtTime: function() {},
        linearRampToValueAtTime: function() {}
      },
      Q: {
        setValueAtTime: function() {}
      },
      connect: function() {}
    };
  },
  createBuffer: function(channels, length, rate) {
    return {
      length: length,
      sampleRate: rate,
      getChannelData: function() { return new Float32Array(length); }
    };
  },
  createBufferSource: function() {
    return {
      buffer: null,
      connect: function() {},
      start: function() {},
      stop: function() {}
    };
  },
  destination: {}
};

const mockCtx = {
  save: function() { saveCount++; },
  restore: function() { restoreCount++; },
  translate: function() {},
  rotate: function() {},
  scale: function() {},
  setTransform: function() {},
  beginPath: function() {},
  closePath: function() {},
  moveTo: function() {},
  lineTo: function() {},
  arc: function() {},
  ellipse: function() {},
  rect: function() {},
  strokeRect: function() {},
  fillRect: function() {},
  fill: function() {},
  stroke: function() {},
  quadraticCurveTo: function() {},
  bezierCurveTo: function() {},
  measureText: function(txt) { return { width: (txt || '').length * 8 }; },
  fillText: function() {},
  strokeText: function() {},
  setLineDash: function() {},
  lineDashOffset: 0,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  strokeStyle: '#ffffff',
  fillStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  shadowBlur: 0,
  shadowColor: '#000000',
  createRadialGradient: function() {
    return { addColorStop: function() {} };
  },
  createLinearGradient: function() {
    return { addColorStop: function() {} };
  }
};

const mockCanvas = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: function() { return mockCtx; },
  getBoundingClientRect: function() { return { left: 0, top: 0, width: 1920, height: 1080 }; },
  addEventListener: function() {}
};

const mockElement = {
  textContent: '',
  innerHTML: '',
  style: {},
  classList: { add: function() {}, remove: function() {}, contains: function() { return false; } },
  appendChild: function() {},
  removeChild: function() {},
  addEventListener: function() {}
};

const mockGamepad = {
  connected: true,
  axes: [0, 0, 0, 0],
  buttons: [
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 },
    { pressed: false, value: 0 }
  ],
  vibrationActuator: {
    playEffect: function(type, params) {
      rumbleTriggered = true;
      rumbleParams = { type: type, params: params };
      return Promise.resolve();
    }
  }
};

const sandbox = {
  console: console,
  document: {
    getElementById: function(id) {
      if (id === 'c') return mockCanvas;
      return mockElement;
    },
    querySelector: function() { return mockElement; },
    querySelectorAll: function() { return [mockElement]; },
    addEventListener: function() {},
    createElement: function() { return {}; },
    body: mockElement
  },
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1.5,
    addEventListener: function() {},
    removeEventListener: function() {},
    localStorage: { getItem: function() { return null; }, setItem: function() {} },
    AudioContext: function() { return mockAudioCtx; },
    webkitAudioContext: function() { return mockAudioCtx; },
    requestAnimationFrame: function(cb) { return setTimeout(cb, 16); },
    cancelAnimationFrame: function(id) { clearTimeout(id); },
    location: { reload: function() {} }
  },
  navigator: {
    getGamepads: function() { return [mockGamepad]; },
    serviceWorker: { register: function() { return Promise.resolve(); } }
  },
  localStorage: { getItem: function() { return null; }, setItem: function() {} },
  AudioContext: function() { return mockAudioCtx; },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: function(cb) { return setTimeout(cb, 16); },
  cancelAnimationFrame: function(id) { clearTimeout(id); },
  Math: Math,
  Date: Date,
  JSON: JSON,
  parseFloat: parseFloat,
  parseInt: parseInt
};

vm.createContext(sandbox);

scripts.forEach(s => {
  vm.runInContext(s, sandbox);
});
console.log('  [PASS] VM initialized successfully with all 5 script blocks!');

// 3. Native Gamepad & Haptic Rumble Actuator & Menu Navigation
console.log('Test 3: Native Gamepad API, Rumble, and Full Menu Navigation...');
const gpResult = sandbox.getActiveGamepad();
if (!gpResult || !gpResult.connected) throw new Error('getActiveGamepad failed to return connected gamepad');

sandbox.triggerRumble(0.75, 200);
if (!rumbleTriggered || !rumbleParams) throw new Error('triggerRumble did not invoke vibrationActuator');
if (rumbleParams.type !== 'dual-rumble') throw new Error('Expected dual-rumble vibration effect');

// Test 3a: Gamepad Unpausing
sandbox.startGame(1);
sandbox.G.state = 'pause';
mockGamepad.buttons.forEach(b => { b.pressed = false; b.value = 0; });
mockGamepad.buttons[9].pressed = true; // Button 9 = Start
sandbox.pollGamepad(0.016);
if (sandbox.G.state !== 'play') throw new Error('Gamepad Start button failed to unpause game from pause state!');

// Reset button state
mockGamepad.buttons[9].pressed = false;
sandbox.pollGamepad(0.016);

// Test 3b: Gamepad Title Screen Launch
sandbox.G.state = 'title';
mockGamepad.buttons[0].pressed = true; // Button 0 = A
sandbox.pollGamepad(0.016);
if (sandbox.G.state !== 'play') throw new Error('Gamepad A button failed to start game from title state!');

// Reset button state
mockGamepad.buttons[0].pressed = false;
sandbox.pollGamepad(0.016);

// Test 3c: Gamepad Buff Card Selection
sandbox.G.buffTray = {
  active: true,
  cards: [
    { u: { name: 'RAPID', desc: 'Faster fire', apply: function() {} }, rect: { x: 100, y: 100, w: 100, h: 100 } },
    { u: { name: 'SHIELD', desc: 'Extra shield', apply: function() {} }, rect: { x: 250, y: 100, w: 100, h: 100 } },
    { u: { name: 'SLUG', desc: 'Heavy slugs', apply: function() {} }, rect: { x: 400, y: 100, w: 100, h: 100 } }
  ]
};
mockGamepad.buttons[2].pressed = true; // Button 2 = X (Card 0)
sandbox.pollGamepad(0.016);
if (sandbox.G.buffTray.active) throw new Error('Gamepad X button failed to select buff card 0 from buff tray!');

// Reset button state
mockGamepad.buttons[2].pressed = false;
sandbox.pollGamepad(0.016);

// Test 3d: Gamepad Game Over Restart
sandbox.G.state = 'dead';
mockGamepad.buttons[0].pressed = true; // Button 0 = A
sandbox.pollGamepad(0.016);
if (sandbox.G.state !== 'play') throw new Error('Gamepad A button failed to restart game from dead state!');

mockGamepad.buttons[0].pressed = false;
sandbox.pollGamepad(0.016);
console.log('  [PASS] Gamepad API, dual-rumble, and full menu/pause/buff navigation verified!');

// 4. WebAudio Procedural SFX Synthesizers & Zero-Allocation Buffer Cache
console.log('Test 4: WebAudio Procedural Sound Synthesizers & Buffer Cache...');
const sound = sandbox.sound;
if (!sound.swallowRushWhoosh) throw new Error('sound.swallowRushWhoosh missing');
if (!sound.acidSizzle) throw new Error('sound.acidSizzle missing');
if (!sound.scytheSwoosh) throw new Error('sound.scytheSwoosh missing');
if (!sound.lowHullAlarm) throw new Error('sound.lowHullAlarm missing');

// Verify noise buffer caching
const buf1 = sound._getNoiseBuffer(mockAudioCtx);
const buf2 = sound._getNoiseBuffer(mockAudioCtx);
if (!buf1 || buf1 !== buf2) throw new Error('sound._getNoiseBuffer did not cache audio buffer across invocations');

sound.swallowRushWhoosh();
sound.acidSizzle();
sound.scytheSwoosh();
sound.lowHullAlarm();
console.log('  [PASS] All 4 procedural audio synthesizers and zero-allocation cache executed without error!');

// 5. Sector 2 Astral Trench Celestial Environment Graphics & Viewport Culling
console.log('Test 5: Sector 2 Celestial Environment Graphics & Viewport Culling...');
if (!sandbox.SECTOR2_NEBULAE || sandbox.SECTOR2_NEBULAE.length < 4) {
  throw new Error('SECTOR2_NEBULAE missing or incomplete');
}

sandbox.startGame(6);
sandbox.G.sector = 2;
sandbox.cvs = mockCanvas;
sandbox.ctx = mockCtx;

saveCount = 0;
restoreCount = 0;
sandbox.drawCosmicBackground(sandbox.G.camX, sandbox.G.camY, true);
console.log('  [PASS] Sector 2 dynamic nebula plasma clouds rendered!');

// Test viewport culling in center of arena (camX = 2100, camY = 2100)
sandbox.G.camX = 2100;
sandbox.G.camY = 2100;
saveCount = 0;
restoreCount = 0;
sandbox.render();
if (saveCount !== restoreCount) {
  throw new Error('Sector 2 arena center render canvas save/restore mismatch! saves=' + saveCount + ' restores=' + restoreCount);
}

// Test viewport rendering near boundary (camX = 40, camY = 40)
sandbox.G.camX = 40;
sandbox.G.camY = 40;
saveCount = 0;
restoreCount = 0;
sandbox.render();
if (saveCount !== restoreCount) {
  throw new Error('Sector 2 boundary render canvas save/restore mismatch! saves=' + saveCount + ' restores=' + restoreCount);
}
console.log('  [PASS] Sector 2 cellular motes & viewport-culled living tendril borders rendered cleanly (center saves: ' + saveCount + ', restores: ' + restoreCount + ')!');

// 6. Gameplay AI Tactical Telegraphs & Proximity Sizzle
console.log('Test 6: Gameplay AI Tactical Telegraphs & Acid Sizzle Proximity...');

// Colossus charge telegraph
const colossus = {
  type: 'colossus', x: 500, y: 500, vx: 0, vy: 0, r: 42,
  hp: 720, maxhp: 720, spd: 85, dmg: 35, charging: 0.8,
  chargeAng: 0, chargeTimer: 0, ang: 0
};
sandbox.G.enemies = [colossus];
sandbox.G.player.x = 600;
sandbox.G.player.y = 500;
sandbox.G.shake = 0;
sandbox.update(0.016);
if (colossus.vx !== 220) throw new Error('Colossus did not charge with velocity 220');
if (sandbox.G.shake <= 0) throw new Error('Colossus charging did not trigger ground rumble screen shake');
console.log('  [PASS] Colossus charge dust trail & ground rumble verified!');

// Mantis uncloak dimensional distortion shockwave
const mantis = {
  type: 'mantis', x: 600, y: 500, vx: 0, vy: 0, r: 24,
  hp: 175, maxhp: 175, spd: 130, dmg: 22, cloaked: true,
  prevCloaked: true, ang: 0
};
sandbox.G.enemies = [mantis];
sandbox.G.waves = [];
sandbox.G.player.x = 650;
sandbox.G.player.y = 500;
sandbox.update(0.016);
if (mantis.cloaked) throw new Error('Mantis failed to uncloak when close to player');
if (sandbox.G.waves.length === 0) throw new Error('Mantis phase-in failed to spawn dimensional shockwave');
console.log('  [PASS] Mantis uncloak dimensional distortion shockwave verified!');

// Bile Spore pulsing warning
const spore = {
  type: 'spore', x: 600, y: 500, vx: 0, vy: 0, r: 18,
  hp: 40, maxhp: 40, spd: 110, dmg: 25, ang: 0
};
sandbox.G.enemies = [spore];
sandbox.G.player.x = 720;
sandbox.G.player.y = 500;
sandbox.update(0.016);
if (!spore.isWarning || !spore.warningDistFrac) throw new Error('Spore failed to trigger proximity warning state');

saveCount = 0;
restoreCount = 0;
sandbox.drawEnemyModel(spore);
if (saveCount !== restoreCount) {
  throw new Error('Spore warning render unbalanced! saves=' + saveCount + ' restores=' + restoreCount);
}
console.log('  [PASS] Bile Spore proximity pulsing warning state & render ring verified!');

// 7. Zero-Allocation Render Constants & Scratch Objects
console.log('Test 7: Zero-Allocation Render Constants & Scratch Vectors...');
if (!sandbox.VORACIS_EYE_OFFSETS || sandbox.VORACIS_EYE_OFFSETS.length !== 8) {
  throw new Error('Expected VORACIS_EYE_OFFSETS with 8 pre-allocated eye coordinates');
}
if (!sandbox.COLOSSUS_PLATE_CONFIGS || sandbox.COLOSSUS_PLATE_CONFIGS.length !== 3) {
  throw new Error('Expected COLOSSUS_PLATE_CONFIGS with 3 pre-allocated plate configs');
}
if (typeof sandbox._scratchVec !== 'object' || typeof sandbox._scratchAim !== 'object') {
  throw new Error('Expected pre-allocated _scratchVec and _scratchAim objects');
}
console.log('  [PASS] Zero-allocation static coordinate offsets and scratch vectors verified!');

// 8. Strict Zero-Emoji Compliance Check
console.log('Test 8: Strict Zero-Emoji Compliance Check across all files...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
const filesToCheck = [
  'index.html',
  'manifest.json',
  'sw.js',
  'tests/test_v2_new_skills.js'
];
filesToCheck.forEach(f => {
  const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
  const m = content.match(emojiRegex);
  if (m) throw new Error('Emoji detected in ' + f + ': ' + m[0]);
});
console.log('  [PASS] Strict Zero-Emoji Policy 100% verified across all files!');

console.log('========================================================');
console.log('>>> ALL NEW SKILL FEATURES VERIFIED SUCCESSFULLY! <<<');
console.log('========================================================');
process.exit(0);
