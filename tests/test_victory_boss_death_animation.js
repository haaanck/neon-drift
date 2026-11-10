const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- TEST SUITE: VICTORY & BOSS DEATH MINI-ANIMATION ---');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}

const mockElement = {
  textContent: '',
  innerHTML: '',
  style: {},
  classList: { add: function() {}, remove: function() {}, contains: function() { return false; } },
  appendChild: function() {},
  removeChild: function() {},
  addEventListener: function() {}
};

const mockGradient = { addColorStop: function() {} };
const ctxMock = new Proxy({}, {
  get: function(target, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
      return function() { return mockGradient; };
    }
    if (prop in target) return target[prop];
    return function() {};
  },
  set: function(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const canvasMock = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: function() { return ctxMock; },
  getBoundingClientRect: function() { return { left: 0, top: 0, width: 1920, height: 1080 }; },
  addEventListener: function() {}
};

const eventListeners = {};
const sandbox = {
  console: console,
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: function(type, fn) {
      eventListeners[type] = eventListeners[type] || [];
      eventListeners[type].push(fn);
    },
    removeEventListener: function() {},
    dispatch: function(type, evt) {
      (eventListeners[type] || []).forEach(function(fn) { fn(evt); });
    },
    localStorage: { getItem: function() { return null; }, setItem: function() {} },
    AudioContext: function() {
      return {
        createGain: function() {
          return {
            connect: function() {},
            gain: { value: 1, setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} }
          };
        },
        createOscillator: function() {
          return {
            connect: function() {},
            start: function() {},
            stop: function() {},
            frequency: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} },
            Q: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} }
          };
        },
        createBufferSource: function() { return { connect: function() {}, start: function() {}, stop: function() {} }; },
        createBuffer: function() { return { getChannelData: function() { return new Float32Array(100); } }; },
        createBiquadFilter: function() {
          return {
            connect: function() {},
            type: 'lowpass',
            frequency: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} },
            Q: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} }
          };
        },
        destination: {}
      };
    }
  },
  document: {
    getElementById: function(id) {
      if (id === 'c') return canvasMock;
      return mockElement;
    },
    querySelector: function() { return mockElement; },
    querySelectorAll: function() { return [mockElement]; },
    addEventListener: function() {},
    body: mockElement
  },
  localStorage: { getItem: function() { return null; }, setItem: function() {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: function() {},
  cancelAnimationFrame: function() {},
  Math: Math,
  Date: Date
};

vm.createContext(sandbox);

for (let i = 0; i < scripts.length; i++) {
  try {
    vm.runInContext(scripts[i], sandbox);
  } catch (err) {
    console.error('Error executing script ' + i + ':', err);
    throw err;
  }
}

// 1. Verify G.dyingBoss and G.victoryTimer initialization in newGame()
console.log('1. Testing Game Initialization...');
vm.runInContext('newGame()', sandbox);
if (sandbox.G.dyingBoss !== null) throw new Error('G.dyingBoss should initialize to null');
if (sandbox.G.victoryTimer !== 0) throw new Error('G.victoryTimer should initialize to 0');
console.log('  ✓ newGame initialized G.dyingBoss: null, G.victoryTimer: 0');

// 2. Trigger Boss Death and verify G.dyingBoss generation
console.log('2. Testing Boss Death Sequence Initialization...');
vm.runInContext('startGame()', sandbox);
const bossKillCode = `
  var b = G.boss;
  b.dormant = false; // awaken boss
  killEnemy(b);
`;
vm.runInContext(bossKillCode, sandbox);
const G = sandbox.G;

if (G.state !== 'victory') throw new Error('killEnemy on boss should set G.state to victory, actual: ' + G.state);
if (!G.dyingBoss) throw new Error('killEnemy on boss should populate G.dyingBoss');
if (G.dyingBoss.shards.length < 30) throw new Error('G.dyingBoss shards count insufficient: ' + G.dyingBoss.shards.length);
if (G.dyingBoss.detonated !== false) throw new Error('G.dyingBoss.detonated should initially be false');
console.log('  ✓ G.dyingBoss successfully populated with ' + G.dyingBoss.shards.length + ' crystal shards');

// 3. Test Phase 1 Simulation (t < 1.2s: Destabilization tremors & micro-explosions)
console.log('3. Testing Phase 1 (Tremors & Destabilization, t < 1.2s)...');
vm.runInContext('update(0.5); render();', sandbox);
if (G.dyingBoss.detonated !== false) throw new Error('Boss should not detonate before t = 1.2s');
if (Math.abs(G.dyingBoss.t - 0.5) > 0.01) throw new Error('G.dyingBoss.t mismatch: ' + G.dyingBoss.t);
console.log('  ✓ Phase 1 rendered cleanly at t = 0.5s');

// 4. Test Phase 2 Supernova Detonation (t = 1.2s)
console.log('4. Testing Phase 2 Supernova Detonation (t >= 1.2s)...');
vm.runInContext('update(0.8); render();', sandbox); // total victoryTimer = 1.3s
if (!G.dyingBoss.detonated) throw new Error('Boss should have detonated at t >= 1.2s');
if (G.shake < 20) throw new Error('Supernova should induce intense screen shake');
console.log('  ✓ Supernova detonation triggered at t >= 1.2s with shockwaves & shard physics');

// 5. Test Player Celebratory Flight & Invulnerability
console.log('5. Testing Player Celebratory Flight Maneuver...');
if (G.player.inv < 100) throw new Error('Player should remain invulnerable during victory sequence');
vm.runInContext('render();', sandbox);
console.log('  ✓ Player victory aura & champion crown rendered cleanly');

// 6. Test Cinematic Letterbox vs. Mission Debrief Card Transition (t < 2.5 vs t >= 2.5)
console.log('6. Testing Transition between Arena Spectate & Mission Debrief Card...');
if (G.victoryTimer >= 2.5) throw new Error('Timer should be < 2.5s');

// At victoryTimer < 2.5s, key press should skip to 2.6s
vm.runInContext("window.dispatch('keydown', { key: ' ', preventDefault: function(){} });", sandbox);
if (sandbox.G.victoryTimer < 2.5) throw new Error('Pressing Space during victory animation should skip to summary card');
console.log('  ✓ Space key during victory animation skipped to debrief card (G.victoryTimer = ' + sandbox.G.victoryTimer + ')');

vm.runInContext('render();', sandbox);
console.log('  ✓ Mission debrief summary card rendered cleanly');

// 7. Verify Space / Click at summary card restarts game
console.log('7. Testing Restart run from Debrief Summary Card...');
vm.runInContext("window.dispatch('keydown', { key: ' ', preventDefault: function(){} });", sandbox);
if (sandbox.G.state !== 'play') throw new Error('Pressing Space on debrief card should start a new game: state is ' + sandbox.G.state);
console.log('  ✓ Game restarted cleanly into play state!');

// 8. Strict Zero-Emoji Audit
console.log('8. Testing Strict Zero-Emoji Compliance across index.html...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
const matches = html.match(new RegExp(emojiRegex, 'gu'));
if (matches && matches.length > 0) throw new Error('Emojis detected in index.html: ' + matches.length);
console.log('  ✓ 0 emojis verified across index.html!');

console.log('===========================================================');
console.log('>>> ALL VICTORY & BOSS DEATH TESTS PASSED (100%)! <<<');
console.log('===========================================================');

process.exit(0);
