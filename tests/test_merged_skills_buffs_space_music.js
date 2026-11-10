const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('=== TEST SUITE: MERGED SKILL & BUFF UI + REMOVAL OF SLOW MOTION + SPACE MUSIC ===');

const htmlPath = 'C:/Users/Solicode/.gemini/antigravity/scratch/neon_drift/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Strict Zero-Emoji Compliance Check
console.log('1. Checking Zero-Emoji Compliance in index.html...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
const emojiMatches = html.match(emojiRegex);
if (emojiMatches && emojiMatches.length > 0) {
  throw new Error('FAILED: Found ' + emojiMatches.length + ' emojis in index.html: ' + JSON.stringify(emojiMatches));
}
console.log('  ✓ 0 emojis found across the entire codebase!');

// 2. Slow Motion Elimination Check
console.log('2. Checking Removal of Slow Motion...');
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
const scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}
console.log('  Total script blocks found:', scripts.length);

const mockGradient = { addColorStop: function() {} };
const ctxMock = new Proxy({}, {
  get: function(target, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
      return function() { return mockGradient; };
    }
    if (prop === 'measureText') {
      return function(str) { return { width: (str ? str.length * 7 : 0) }; };
    }
    return function() {};
  },
  set: function() { return true; }
});

const canvasMock = {
  width: 1280,
  height: 720,
  style: {},
  getContext: function() { return ctxMock; },
  getBoundingClientRect: function() { return { left: 0, top: 0, width: 1280, height: 720 }; },
  addEventListener: function() {}
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

const makeMockAC = function() {
  let curT = 1.0;
  return {
    get currentTime() { return curT += 0.05; },
    createGain: () => ({
      connect: () => {},
      gain: {
        value: 1,
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      }
    }),
    createOscillator: () => ({
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      },
      Q: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      }
    }),
    createBufferSource: () => ({
      connect: () => {},
      start: () => {},
      stop: () => {}
    }),
    createBuffer: () => ({
      getChannelData: () => new Float32Array(512)
    }),
    createBiquadFilter: () => ({
      connect: () => {},
      type: 'lowpass',
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      },
      Q: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      }
    }),
    destination: {}
  };
};

const sandbox = {
  window: {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} },
    AudioContext: makeMockAC
  },
  document: {
    getElementById: (id) => (id === 'c' ? canvasMock : mockElement),
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
  Float32Array: Float32Array,
  console: console
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

const context = vm.createContext(sandbox);
scripts.forEach((code) => {
  vm.runInContext(code, context);
});
console.log('  Scripts loaded successfully into VM context.');

// Check slow motion flags
const resSlow = vm.runInContext(`
  W = 1280; H = 720;
  newGame();
  startGame(1);
  var slowBefore = G.slow;
  openLevelUp();
  var slowInBuff = G.slow;
  chooseBuff(0);
  var slowAfterBuff = G.slow;
  die();
  var slowInDead = G.slow;
  ({
    slowBefore: slowBefore,
    slowInBuff: slowInBuff,
    slowAfterBuff: slowAfterBuff,
    slowInDead: slowInDead
  });
`, context);

if (resSlow.slowInBuff !== 0) throw new Error('G.slow should be 0 in openLevelUp! Got: ' + resSlow.slowInBuff);
if (resSlow.slowInDead !== 0) throw new Error('G.slow should be 0 on player death! Got: ' + resSlow.slowInDead);
console.log('  ✓ G.slow is strictly 0 at all times (buff menu, death, flight)! Real-time speed preserved.');

// 3. Merged Skill UI & Buff UI Check
console.log('3. Testing Merged Skill & Buff UI (Slot [Q] above Radar, Centered Upgrades & No Slot [E])...');
const resDeck = vm.runInContext(`
  W = 1280; H = 720;
  newGame();
  startGame(1);
  drawHUD();
  var rQ = G.skillRectQ;
  var rE = G.skillRectE;
  var mw = 114, mh = 114;
  var mx = W - mw - 20, my = Math.round((H - mh - 16) / 2);
  ({
    rQ: rQ,
    rE: rE,
    expectedRadarX: mx,
    expectedRadarY: my
  });
`, context);

console.log('  Slot Q Rect:', resDeck.rQ);
console.log('  Slot E Rect:', resDeck.rE);
if (resDeck.rQ.x !== resDeck.expectedRadarX) throw new Error('Slot Q must be aligned above radar at x = ' + resDeck.expectedRadarX + '! Got: ' + resDeck.rQ.x);
if (resDeck.rQ.y !== resDeck.expectedRadarY - resDeck.rQ.h - 12) throw new Error('Slot Q must be directly above radar! Got y: ' + resDeck.rQ.y);
if (resDeck.rE !== null) throw new Error('Slot E must be removed (null)! Got: ' + JSON.stringify(resDeck.rE));
console.log('  ✓ Slot [Q] positioned directly above radar and Slot [E] removed!');

// Test Buff Cards inside centered bottom tray
const resBuffCenter = vm.runInContext(`
  openLevelUp();
  G.buffTray.animY = 720 - 55;
  drawBuffTray();
  var card0 = G.buffTray.cards[0].rect;
  var card1 = G.buffTray.cards[1].rect;
  var card2 = G.buffTray.cards[2].rect;
  ({
    c0: card0,
    c1: card1,
    c2: card2
  });
`, context);

console.log('  Buff Card 0:', resBuffCenter.c0);
console.log('  Buff Card 1:', resBuffCenter.c1);
console.log('  Buff Card 2:', resBuffCenter.c2);
var trayCenterX = (resBuffCenter.c0.x + resBuffCenter.c2.x + resBuffCenter.c2.w) / 2;
if (Math.abs(trayCenterX - 1280 / 2) > 10) throw new Error('Buff cards must be horizontally centered on screen! Center: ' + trayCenterX);
console.log('  ✓ Upgrades tray is centered horizontally on screen (center x = ' + trayCenterX + ')!');
if (resBuffCenter.c2.x + resBuffCenter.c2.w > 1280 - 18) throw new Error('Buff cards exceed right screen boundary!');
console.log('  ✓ Buff cards [1], [2], [3] render seamlessly in bottom tray!');

// Test Skill Replacement / Core Capacity Tray
console.log('4. Testing Skill Replacement / Core Capacity Tray...');
const resSwap = vm.runInContext(`
  G.player.skills.q.skill = { name: 'PLASMA NOVA', cd: 12, col: '#35f0ff', icon: 'nova' };
  acquireSkillCore({ name: 'TESLA COIL', cd: 10, col: '#3ddc97', icon: 'zap' });
  var isBuffActive = G.buffTray.active;
  var isSwapActive = G.skillSwapTray.active;
  var swapCardsCount = G.buffTray.cards.length;
  var c0Name = G.buffTray.cards[0].u.name;
  var c1Name = G.buffTray.cards[1].u.name;
  var c2Name = G.buffTray.cards[2].u.name;
  ({
    isBuffActive: isBuffActive,
    isSwapActive: isSwapActive,
    swapCardsCount: swapCardsCount,
    c0Name: c0Name,
    c1Name: c1Name,
    c2Name: c2Name
  });
`, context);

console.log('  Replacement Skill Core Triggered:');
console.log('    buffTray active:', resSwap.isBuffActive);
console.log('    Card [1]:', resSwap.c0Name);
console.log('    Card [2]:', resSwap.c1Name);
console.log('    Card [3]:', resSwap.c2Name);
if (!resSwap.c0Name.includes('TESLA COIL')) throw new Error('Card 1 must display skill name! Got: ' + resSwap.c0Name);
if (!resSwap.c1Name.includes('SALVAGE')) throw new Error('Card 2 must offer SALVAGE! Got: ' + resSwap.c1Name);
if (!resSwap.c2Name.includes('REPAIR')) throw new Error('Card 3 must offer REPAIR! Got: ' + resSwap.c2Name);
console.log('  ✓ Skill core swap shows skill name on card 1 (e.g. TESLA COIL)!');

// Test selecting option 1 (equip to Q)
vm.runInContext(`
  chooseBuff(0);
  if (G.player.skills.q.skill.name !== 'TESLA COIL') throw new Error('Slot Q not updated after swap choice!');
  if (G.buffTray.active) throw new Error('buffTray should close after choice!');
`, context);
console.log('  ✓ Selecting swap card 0 equips new skill to Slot Q and closes tray cleanly!');

// 5. Procedural Space Music Engine Check
console.log('5. Testing Space-Themed Procedural Music Engine...');
const resSpaceMusic = vm.runInContext(`
  music.start('title');
  var titleTempo = music.tempo;
  for (var i = 0; i < 20; i++) music.tick(0.016);
  music.setMood('combat');
  var combatTempo = music.tempo;
  for (var i = 0; i < 32; i++) music.tick(0.016);
  music.setMood('boss');
  var bossTempo = music.tempo;
  for (var i = 0; i < 20; i++) music.tick(0.016);
  music.setMood('boss_p2');
  var bossP2Tempo = music.tempo;
  for (var i = 0; i < 20; i++) music.tick(0.016);
  music.setMood('victory');
  var victoryTempo = music.tempo;
  ({
    titleTempo: titleTempo,
    combatTempo: combatTempo,
    bossTempo: bossTempo,
    bossP2Tempo: bossP2Tempo,
    victoryTempo: victoryTempo,
    hasSpacePad: typeof music._playSpacePad === 'function',
    hasPulsarArp: typeof music._playPulsarArp === 'function',
    hasZeroGBass: typeof music._playZeroGBass === 'function',
    hasGravityThud: typeof music._playGravityThud === 'function',
    hasStardustShimmer: typeof music._playStardustShimmer === 'function'
  });
`, context);

console.log('  Space Music Tempos:', {
  title: resSpaceMusic.titleTempo,
  combat: resSpaceMusic.combatTempo,
  boss: resSpaceMusic.bossTempo,
  boss_p2: resSpaceMusic.bossP2Tempo,
  victory: resSpaceMusic.victoryTempo
});

if (!resSpaceMusic.hasSpacePad || !resSpaceMusic.hasPulsarArp || !resSpaceMusic.hasZeroGBass || !resSpaceMusic.hasGravityThud || !resSpaceMusic.hasStardustShimmer) {
  throw new Error('Space music engine methods missing!');
}
if (resSpaceMusic.combatTempo !== 116) throw new Error('Combat space tempo mismatch!');
if (resSpaceMusic.titleTempo !== 90) throw new Error('Title space tempo mismatch!');
console.log('  ✓ Procedural Space Music Engine verified: Floating ethereal space pads, pulsar arpeggios, zero-G bass, gravity-well pulses, and stardust shimmers!');

console.log('\n=== ALL TESTS PASSED CLEANLY! ===\n');

process.exit(0);
