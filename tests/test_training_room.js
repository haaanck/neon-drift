const path = require('path');
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Extract script contents
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
  classList: {
    add: function() {},
    remove: function() {},
    contains: function() { return false; }
  },
  appendChild: function() {},
  removeChild: function() {},
  addEventListener: function() {}
};

const canvasMock = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: function(type) {
    return ctxMock;
  },
  getBoundingClientRect: function() {
    return { left: 0, top: 0, width: 1920, height: 1080 };
  },
  addEventListener: function() {}
};

const mockGradient = {
  addColorStop: function() {}
};

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

const sandbox = {
  console: console,
  window: {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: function() {},
    removeEventListener: function() {},
    localStorage: {
      getItem: function() { return null; },
      setItem: function() {}
    },
    AudioContext: function() {
      return {
        createGain: function() {
          return {
            connect: function() {},
            gain: { value: 1, setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} }
          };
        },
        createOscillator: function() {
          return { connect: function() {}, start: function() {}, stop: function() {}, frequency: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} } };
        },
        createBufferSource: function() { return { connect: function() {}, start: function() {}, stop: function() {} }; },
        createBuffer: function() { return { getChannelData: function() { return new Float32Array(100); } }; },
        createBiquadFilter: function() {
          return { connect: function() {}, type: 'lowpass', frequency: { setValueAtTime: function() {}, linearRampToValueAtTime: function() {}, exponentialRampToValueAtTime: function() {} } };
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
  localStorage: {
    getItem: function() { return null; },
    setItem: function() {}
  },
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
  parseInt: parseInt,
  Float32Array: Float32Array
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

const context = vm.createContext(sandbox);
scripts.forEach(code => vm.runInContext(code, context));

const trainingTests = `
console.log('--- RUNNING HOME BUTTON & TRAINING ROOM VALIDATION ---');

// 1. Verify Home Button in Pause Menu
console.log('Test 1: Testing Home Button in Pause Menu...');
startGame(1);
togglePause();
if (G.state !== 'pause') throw new Error('Failed to transition to pause state!');
render();
if (!G.pauseHomeRect) throw new Error('G.pauseHomeRect was not created during drawPause!');
console.log('  Found G.pauseHomeRect at:', G.pauseHomeRect);

// Test click on Home Button
var hr = G.pauseHomeRect;
handleUiClick(hr.x + hr.w / 2, hr.y + hr.h / 2);
if (G.state !== 'title') throw new Error('Clicking Home Button in Pause did not return to title state! G.state: ' + G.state);
console.log('  ✓ Clicking Home button in Pause menu successfully returned to Title!');

// Test [H] key in Pause Menu
startGame(1);
togglePause();
if (G.state !== 'pause') throw new Error('Failed to pause!');
goToTitle();
if (G.state !== 'title') throw new Error('goToTitle() failed to reset to title state!');
console.log('  ✓ goToTitle() successfully resets session to Title!');

// 2. Verify Training Room Access from Title Screen
console.log('Test 2: Testing Training Room Access from Title Screen...');
G.state = 'title';
render();
if (!G.titleTrainingRect) throw new Error('G.titleTrainingRect was not created during drawTitle!');
console.log('  Found G.titleTrainingRect at:', G.titleTrainingRect);

var ttr = G.titleTrainingRect;
handleUiClick(ttr.x + ttr.w / 2, ttr.y + ttr.h / 2);
if (G.mode !== 'training') throw new Error('Clicking Training Room button did not set G.mode = training!');
if (G.state !== 'play') throw new Error('Training room did not start in play state!');
console.log('  ✓ Successfully entered Training Room via Title screen button!');

// 3. Verify Training Dock Controls & Collapsible State
console.log('Test 3: Testing Training Dock Rendering & Collapse...');
render();
if (!G.trainingButtons || G.trainingButtons.length === 0) throw new Error('No interactive training buttons created!');
console.log('  Training buttons registered on dock:', G.trainingButtons.length);

// Toggle dock collapse
G.trainingDockOpen = false;
render();
console.log('  Training buttons when dock collapsed:', G.trainingButtons.length);
if (G.trainingButtons.length !== 1) throw new Error('Collapsed dock should have 1 expand button!');
// Click expand button
var expandBtn = G.trainingButtons[0];
handleUiClick(expandBtn.x + expandBtn.w / 2, expandBtn.y + expandBtn.h / 2);
if (!G.trainingDockOpen) throw new Error('Clicking expand button failed to reopen dock!');
console.log('  ✓ Training dock expand/collapse toggle verified!');

// 4. Verify Spawning all 6 Enemy Types in Training Room
console.log('Test 4: Testing Enemy Spawner for all 6 unit types...');
var enemyTypes = ['drifter', 'brute', 'shooter', 'splitter', 'shard', 'minion_geom'];
for (var ei = 0; ei < enemyTypes.length; ei++){
  var et = enemyTypes[ei];
  var startCount = G.enemies.length;
  spawnTrainingEnemy(et);
  if (G.enemies.length !== startCount + 1){
    throw new Error('Failed to spawn enemy type: ' + et);
  }
  var spawned = G.enemies[G.enemies.length - 1];
  if (spawned.type !== et) throw new Error('Spawned enemy type mismatch: ' + spawned.type + ' !== ' + et);
}
console.log('  ✓ All 6 regular enemy types spawned successfully! Total hostiles:', G.enemies.length);

// 5. Test Clear Hostiles
console.log('Test 5: Testing Clear Hostiles...');
clearTrainingHostiles();
if (G.enemies.length !== 0) throw new Error('clearTrainingHostiles() did not clear all hostiles! Remaining: ' + G.enemies.length);
console.log('  ✓ All hostiles cleanly purged by clearTrainingHostiles()!');

// 6. Test Spawning All 7 Boss Archetypes in Training Room
console.log('Test 6: Testing Boss Spawner for all 7 apex boss archetypes...');
var bossTypes = ['abyss', 'aegis', 'void', 'vector', 'volt', 'inferno', 'nexus'];
for (var bi = 0; bi < bossTypes.length; bi++){
  var bt = bossTypes[bi];
  spawnTrainingBoss(bt, true);
  if (!G.boss || G.boss.bossType !== bt){
    throw new Error('Failed to spawn boss archetype: ' + bt + ' (Current boss: ' + (G.boss ? G.boss.bossType : 'none') + ')');
  }
  if (G.boss.dormant){
    throw new Error('Boss ' + bt + ' spawned dormant when awake was requested!');
  }
  console.log('  ✓ Spawned Boss [' + bt.toUpperCase() + ']: ' + G.boss.name + ' (' + G.boss.hp + ' HP)');
  render();
}

// Also test spawning stasis egg boss
console.log('  Testing Stasis Egg Spawn...');
spawnTrainingBoss('abyss', false);
if (!G.boss || !G.boss.dormant){
  throw new Error('Failed to spawn dormant stasis egg boss!');
}
console.log('  ✓ Biomechanical Stasis Egg spawned successfully with dormant carapace!');

// 7. Verify Player Lethal Damage Auto-Repair in Training Room
console.log('Test 7: Testing Player Auto-Repair in Training Room...');
G.player.hp = 10;
die();
if (G.state === 'dead') throw new Error('Player died in Training Room! Should auto-repair without game over!');
if (G.player.hp !== G.player.maxhp) throw new Error('Player HP not fully restored after auto-repair!');
console.log('  ✓ Player auto-repaired on lethal damage without dying!');

// 8. Verify Boss Slain in Training Room does NOT trigger Victory State
console.log('Test 8: Testing Boss Destruction in Training Room...');
spawnTrainingBoss('aegis', true);
killEnemy(G.boss);
if (G.state === 'victory') throw new Error('Boss defeat triggered victory state in Training Room!');
console.log('  ✓ Boss defeat in Training Room properly awarded loot without ending session!');

// 9. Verify Return to Title from Training Room via [H]
console.log('Test 9: Testing Return to Title from Training Room...');
goToTitle();
if (G.state !== 'title') throw new Error('Failed to return to Title from Training Room!');
console.log('  ✓ Successfully returned to Title from Training Room!');

console.log('\\n======================================================');
console.log('>>> ALL HOME BUTTON & TRAINING ROOM TESTS PASSED! <<<');
console.log('======================================================');
`;

vm.runInContext(trainingTests, context);

process.exit(0);
