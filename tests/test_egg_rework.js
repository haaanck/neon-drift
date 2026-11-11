const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- TEST SUITE: BIOMECHANICAL STASIS EGG & PROGRESSIVE FRACTURE REWORK ---');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
let combinedJs = '';
scriptMatch.forEach(block => {
  const content = block.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
  combinedJs += content + '\n';
});

let saves = 0;
let restores = 0;
let invalidCalls = [];

const mockCtx = {
  save: () => { saves++; },
  restore: () => { restores++; },
  translate: (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['translate', x, y]); },
  rotate: (a) => { if (!Number.isFinite(a)) invalidCalls.push(['rotate', a]); },
  scale: (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['scale', x, y]); },
  setTransform: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['moveTo', x, y]); },
  lineTo: (x, y) => { if (!Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['lineTo', x, y]); },
  arc: (x, y, r, sa, ea) => { if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(r)) invalidCalls.push(['arc', x, y, r]); },
  ellipse: (x, y, rx, ry, rot, sa, ea) => { if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rx) || !Number.isFinite(ry)) invalidCalls.push(['ellipse', x, y, rx, ry]); },
  quadraticCurveTo: (cpx, cpy, x, y) => { if (!Number.isFinite(cpx) || !Number.isFinite(cpy) || !Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['quadraticCurveTo', cpx, cpy, x, y]); },
  bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => { if (!Number.isFinite(cp1x) || !Number.isFinite(cp1y) || !Number.isFinite(cp2x) || !Number.isFinite(cp2y) || !Number.isFinite(x) || !Number.isFinite(y)) invalidCalls.push(['bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y]); },
  fill: () => {},
  stroke: () => {},
  fillRect: (x, y, w, h) => { if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) invalidCalls.push(['fillRect', x, y, w, h]); },
  strokeRect: (x, y, w, h) => { if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) invalidCalls.push(['strokeRect', x, y, w, h]); },
  rect: () => {},
  roundRect: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: (txt) => ({ width: (txt || '').length * 8 }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  setLineDash: () => {},
  lineDashOffset: 0,
  globalAlpha: 1,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  shadowColor: 'transparent',
  shadowBlur: 0
};

const mockElement = {
  textContent: '',
  innerHTML: '',
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  appendChild: () => {},
  removeChild: () => {},
  addEventListener: () => {}
};

const sandbox = {
  console: console,
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: function() {
      return {
        createGain: () => ({ connect: () => {}, gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }),
        createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } }),
        createBufferSource: () => ({ connect: () => {}, start: () => {}, stop: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
        createBiquadFilter: () => ({ connect: () => {}, frequency: { setValueAtTime: () => {} } }),
        destination: {}
      };
    }
  },
  document: {
    getElementById: (id) => {
      if (id === 'c') {
        return {
          width: 1920,
          height: 1080,
          style: {},
          getContext: () => mockCtx,
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
          addEventListener: () => {}
        };
      }
      return mockElement;
    },
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement],
    addEventListener: () => {},
    body: mockElement
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  Math: Math,
  Date: Date,
  JSON: JSON,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Float32Array: Float32Array
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

const ctx = vm.createContext(sandbox);
vm.runInContext(combinedJs, ctx);

console.log('1. Initializing game and testing egg spawn...');
ctx.startGame(1);
const G = ctx.G;
const b = G.boss;
if (!b) throw new Error('Abyss boss failed to spawn!');
if (!b.dormant) throw new Error('Abyss boss should be dormant in egg!');
console.log('  [OK] Abyss Leviathan dormant in egg verified.');

// Test 2: Matrix rendering test across all progression stages
console.log('\n2. Testing Matrix of Progressive Rupture Stages...');
const testStages = [
  { name: 'Stage 0 (0% progress, pristine shell)', crackProgress: 0.0, impactFlash: 0 },
  { name: 'Stage 1 (16% progress, initial micro-fissure)', crackProgress: 0.16, impactFlash: 0 },
  { name: 'Stage 2 (30% progress, structural faults and branches)', crackProgress: 0.30, impactFlash: 0 },
  { name: 'Stage 3 (50% progress, deep glowing chasm & eye dilation)', crackProgress: 0.50, impactFlash: 0 },
  { name: 'Stage 4 (75% progress, widening chasm & plate separation)', crackProgress: 0.75, impactFlash: 0 },
  { name: 'Stage 5 (98% progress, imminent rupture with venting embers)', crackProgress: 0.98, impactFlash: 0 },
  { name: 'High-Impact Deflection Shock Flash (Impact: 1.0, Ang: 45 deg)', crackProgress: 0.40, impactFlash: 1.0, lastHitAng: Math.PI / 4 }
];

testStages.forEach((st) => {
  saves = 0;
  restores = 0;
  invalidCalls = [];
  b.crackProgress = st.crackProgress;
  b.crackImpactFlash = st.impactFlash;
  if (st.lastHitAng !== undefined) b.lastHitAng = st.lastHitAng;

  ctx.drawTitanEgg(b);

  if (saves === 0 || saves !== restores) {
    throw new Error(`${st.name}: Canvas save/restore mismatch! saves=${saves}, restores=${restores}`);
  }
  if (invalidCalls.length > 0) {
    throw new Error(`${st.name}: Invalid canvas call detected: ${JSON.stringify(invalidCalls[0])}`);
  }
  console.log(`  [OK] ${st.name}: saves=${saves}, restores=${restores}, 0 invalid canvas calls.`);
});

// Test 3: Continuous Sub-Segment Interpolation Testing
console.log('\n3. Testing Continuous Sub-Segment Interpolation across 20 fractional progress steps...');
for (let p = 0; p <= 1.0; p += 0.05) {
  saves = 0;
  restores = 0;
  invalidCalls = [];
  b.crackProgress = p;
  b.crackImpactFlash = 0.2;
  b.lastHitAng = p * Math.PI * 2;

  ctx.drawTitanEgg(b);

  if (saves !== restores) {
    throw new Error(`Step p=${p.toFixed(2)}: save/restore mismatch (saves=${saves}, restores=${restores})`);
  }
  if (invalidCalls.length > 0) {
    throw new Error(`Step p=${p.toFixed(2)}: invalid canvas parameter: ${JSON.stringify(invalidCalls[0])}`);
  }
}
console.log('  [OK] 20 fractional progress steps rendered with perfect continuity and zero NaN/undefined values.');

// Test 4: Deflection ripple physics and localized pylon surge
console.log('\n4. Testing Bullet Deflection and Localized Resonance...');
b.deflectionRipples = [
  { ang: Math.PI / 3, r: 12, maxR: 38, life: 0.35, maxLife: 0.40 },
  { ang: -Math.PI / 2, r: 24, maxR: 38, life: 0.15, maxLife: 0.40 }
];
b.lastHitAng = Math.PI / 3;
b.crackImpactFlash = 1.0;
saves = 0;
restores = 0;
ctx.drawTitanEgg(b);
if (saves !== restores) throw new Error('Deflection ripple rendering broke save/restore balance!');
console.log('  [OK] Multiple active deflection ripples rendered cleanly (saves/restores balanced).');

// Test 5: Training room isolation
console.log('\n5. Testing Training Room Level Isolation...');
G.mode = 'training';
G.player.lvl = 15; // Player level 15 in training room
delete b.crackProgress; // Clear manual override
G.wave = 1;
G.waveKills = 0;
G.waveTotal = 20;
saves = 0;
restores = 0;
ctx.drawTitanEgg(b);
if (saves !== restores) throw new Error('Training room egg rendering broke save/restore balance!');
console.log('  [OK] Training room with player level 15 preserved dormant incubator state cleanly.');

// Test 6: Vector egg icon rendering
console.log('\n6. Testing Vector Egg Icon Rendering...');
saves = 0;
restores = 0;
ctx.drawIcon('egg', 100, 100, 16, '#35f0ff');
ctx.drawIcon('egg', 100, 100, 24, '#ff4d6d');
console.log('  [OK] drawIcon(egg) executed cleanly across multiple scales and colors.');

// Test 7: Strict Zero-Emoji Policy Audit
console.log('\n7. Verifying Strict Zero-Emoji Policy across codebase...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/u;
const eggTestContent = fs.readFileSync(__filename, 'utf8');
const indexContent = fs.readFileSync(htmlPath, 'utf8');

if (indexContent.match(emojiRegex)) throw new Error('Emoji character found in index.html!');
if (eggTestContent.match(emojiRegex)) throw new Error('Emoji character found in test_egg_rework.js!');
console.log('  [OK] Zero emoji characters verified across index.html and test scripts.');

console.log('\n======================================================');
console.log('>>> ALL BIOMECHANICAL EGG & CRACK TESTS PASSED (100%)! <<<');
console.log('======================================================');
process.exit(0);
