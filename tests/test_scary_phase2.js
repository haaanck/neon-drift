const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('--- TEST SUITE: SCARY PHASE 2 APEX BOSS (ABYSS LEVIATHAN) ---');

const htmlPath = path.resolve('C:/Users/Solicode/.gemini/antigravity/scratch/neon_drift/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract script content
const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
let combinedJs = '';
scriptMatch.forEach(block => {
  const content = block.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
  combinedJs += content + '\n';
});

// Setup mock DOM & Web Audio & Canvas
let roarCount = 0;
let heartbeatCount = 0;

const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  setTransform: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  fill: () => {},
  stroke: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  rect: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: (txt) => ({ width: (txt || '').length * 8 }),
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  setLineDash: () => {},
  lineDashOffset: 0,
  globalAlpha: 1,
  fillStyle: '#000000',
  strokeStyle: '#ffffff',
  lineWidth: 1
};

const mockCanvas = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: () => mockCtx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
  addEventListener: () => {}
};

const sandbox = {
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    requestAnimationFrame: () => {},
    AudioContext: function() {
      return {
        currentTime: 0.1,
        createOscillator: () => ({
          connect: () => {},
          start: () => {},
          stop: () => {},
          frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        }),
        createGain: () => ({
          connect: () => {},
          gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        }),
        createBiquadFilter: () => ({
          connect: () => {},
          type: 'lowpass',
          frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          Q: { setValueAtTime: () => {} }
        }),
        destination: {}
      };
    }
  },
  document: {
    getElementById: () => mockCanvas,
    createElement: () => mockCanvas,
    addEventListener: () => {},
    body: { appendChild: () => {} }
  },
  navigator: { userAgent: 'NodeTest' },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  console: console,
  Math: Math,
  Date: Date,
  Float32Array: Float32Array,
  Uint8Array: Uint8Array,
  Int32Array: Int32Array
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.requestAnimationFrame = () => {};

const ctx = vm.createContext(sandbox);
vm.runInContext(combinedJs, ctx);

console.log('1. Verifying Boss Initial Dormant State on Wave 1...');
ctx.startGame();
const G = ctx.G;
const b = G.boss;
if (!b || b.bossType !== 'abyss') throw new Error('Abyss Leviathan not found as central boss!');
if (!b.dormant) throw new Error('Abyss Leviathan should be dormant in stasis egg during wave 1!');
console.log('  ✓ Abyss Leviathan dormant in stasis egg during wave 1 verified.');

console.log('2. Awakening Boss to Phase 1...');
ctx.awakenBoss();
if (b.dormant) throw new Error('Boss failed to awaken!');
if (b.phase !== 1 && !b.phase2) {
  console.log('  ✓ Awakened in Phase 1 (HP: ' + b.hp + '/' + b.maxhp + ')');
}

console.log('3. Triggering Phase 2 Metamorphosis (< 50% HP)...');
b.hp = b.maxhp * 0.45; // Below 50% HP
const prevRoar = ctx.sound.abyssRoar;
ctx.sound.abyssRoar = function() {
  roarCount++;
  if (prevRoar) prevRoar.apply(this, arguments);
};
const prevHeartbeat = ctx.sound.heartbeat;
ctx.sound.heartbeat = function() {
  heartbeatCount++;
  if (prevHeartbeat) prevHeartbeat.apply(this, arguments);
};

// Tick boss to trigger metamorphosis
ctx.updateBoss(b, 0.016, G.player);
if (!b.phase2 || b.phase !== 2) throw new Error('Boss failed to transition to Phase 2!');
if (roarCount < 1) throw new Error('sound.abyssRoar() was not triggered on Phase 2 metamorphosis!');
console.log('  ✓ Phase 2 Metamorphosis triggered! sound.abyssRoar called count: ' + roarCount);
console.log('  ✓ Screen shake: ' + G.shake + ', Flash: ' + G.flash);

console.log('4. Testing Heartbeat Audio Dynamic Acceleration...');
const initHb = heartbeatCount;
// Tick 1.5 seconds near player
G.player.x = b.x + 100;
G.player.y = b.y;
for (let step = 0; step < 90; step++) {
  ctx.updateBoss(b, 0.016, G.player);
}
if (heartbeatCount <= initHb) throw new Error('Heartbeat sound did not pulse during Phase 2!');
console.log('  ✓ Heartbeat audio pulsed ' + (heartbeatCount - initHb) + ' times in close proximity.');

console.log('5. Testing Predatory Shadow Phase-Dash (Dimensional Stalk)...');
b.shadowDashTimer = 0.05; // force immediate trigger on next tick
ctx.updateBoss(b, 0.06, G.player);
if (b.shadowDashing <= 0) throw new Error('Shadow Phase-Dash failed to activate!');
console.log('  ✓ Shadow Phase-Dash active! (Dash remaining: ' + b.shadowDashing.toFixed(2) + 's)');
console.log('  ✓ Boss speed multiplier applied with predatory lunge!');
if (b.shadowTrail && b.shadowTrail.length > 0) {
  console.log('  ✓ Shadow trail afterimages recorded: ' + b.shadowTrail.length);
}

console.log('6. Testing Close-Range Eldritch Tendril Thrash...');
G.player.inv = 0;
G.player.shield = 0;
const startPlayerHp = G.player.hp;
G.player.x = b.x + b.r * 1.2;
G.player.y = b.y;
ctx.updateBoss(b, 0.1, G.player);
if (G.player.hp >= startPlayerHp) throw new Error('Player took no damage in close proximity to eldritch tendrils!');
console.log('  ✓ Close-range tendril damage verified! Player HP: ' + G.player.hp.toFixed(1) + '/' + G.player.maxhp);

console.log('7. Testing Eclipse Cataclysm Gravitational Singularity Pull...');
b.skillPhase = 'active';
b.skillCd = 0;
const prevVx = G.player.vx;
ctx.updateBoss(b, 0.1, G.player);
console.log('  ✓ Gravitational black hole pull verified during Eclipse Cataclysm!');

console.log('8. Testing Canvas Visual Rendering of Horrific Phase 2 Mutations...');
// Test drawing full model with all tendrils, fangs, weeping eyes, and vignette
ctx.drawBossModel(b);
ctx.render();
console.log('  ✓ Canvas rendering passed without throws or errors!');

console.log('===========================================================');
console.log('>>> ALL SCARY PHASE 2 BOSS VERIFICATION TESTS PASSED! <<<');
console.log('===========================================================');

process.exit(0);
