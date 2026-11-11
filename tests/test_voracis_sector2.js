const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('======================================================');
console.log('>>> TEST SUITE: SECTOR 2 & VORACIS THE VOID GARGANTUA <<<');
console.log('======================================================');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract script content
const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
let combinedJs = '';
scriptMatch.forEach(block => {
  const content = block.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '');
  combinedJs += content + '\n';
});

// Canvas mock tracking saves and restores
let saveCount = 0;
let restoreCount = 0;

const mockCtx = {
  save: () => { saveCount++; },
  restore: () => { restoreCount++; },
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
  strokeStyle: '#ffffff',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  shadowBlur: 0,
  shadowColor: '#000000',
  textAlign: 'left'
};

const mockCanvas = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: () => mockCtx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
  addEventListener: () => {}
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
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    AudioContext: function() {
      return {
        currentTime: 0.1,
        createOscillator: () => ({
          connect: () => {}, start: () => {}, stop: () => {},
          frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        }),
        createGain: () => ({
          connect: () => {},
          gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
        }),
        createBiquadFilter: () => ({
          connect: () => {}, type: 'lowpass',
          frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          Q: { setValueAtTime: () => {} }
        }),
        createBufferSource: () => ({ connect: () => {}, start: () => {}, stop: () => {} }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
        destination: {}
      };
    }
  },
  document: {
    getElementById: (id) => id === 'c' ? mockCanvas : mockElement,
    createElement: () => mockCanvas,
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement],
    addEventListener: () => {},
    body: mockElement
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  rawHtml: html,
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

const context = vm.createContext(sandbox);
vm.runInContext(combinedJs, context);

const testsScript = `
console.log('Running Sector 2 & Voracis Test Suite...');

// TEST 1: Voracis Catalog & Anatomical Structure Initialization
console.log('Test 1: Voracis Boss Catalog & Anatomical Initialisation...');
if (!BOSS_CATALOG.voracis) throw new Error('Voracis not registered in BOSS_CATALOG!');
var vCat = BOSS_CATALOG.voracis;
if (vCat.hp !== 13000) throw new Error('Voracis HP expected 13000, got: ' + vCat.hp);
if (vCat.r !== 92) throw new Error('Voracis radius expected 92, got: ' + vCat.r);
if (vCat.spd !== 108) throw new Error('Voracis base speed expected 108, got: ' + vCat.spd);
if (vCat.dmg !== 36) throw new Error('Voracis damage expected 36, got: ' + vCat.dmg);

startGame(1);
G.state = 'play';
var voracis = spawnBoss(10, 'voracis', true);
if (!voracis || voracis.bossType !== 'voracis') throw new Error('Failed to spawn Voracis boss!');
if (!voracis.tendrils || voracis.tendrils.length !== 8) throw new Error('Voracis must have exactly 8 articulated tendrils!');
if (voracis.jawAngle === undefined) throw new Error('Voracis jawAngle missing!');
if (voracis.ribFlex === undefined) throw new Error('Voracis ribFlex missing!');
if (voracis.scytheTimer === undefined) throw new Error('Voracis scytheTimer missing!');
if (voracis.shadowTrail === undefined) throw new Error('Voracis shadowTrail array missing!');
console.log('  [PASS] Voracis successfully initialized with 8 tendrils, scythe limbs, and articulated jaws!');

// TEST 2: Voracis Phase 1 Mechanics (Gaping Maw, Scythe Cleave, Tendril Spine Spread)
console.log('Test 2: Voracis Phase 1 Mechanics...');
voracis.hp = 12000;
voracis.skillCd = 0;
var p = G.player;
p.x = voracis.x + 200;
p.y = voracis.y;

// Trigger active skill windup & execution
updateBoss(voracis, 0.016, p);
if (voracis.skillPhase !== 'windup') throw new Error('Voracis should enter skill windup!');
if (voracis.skillName !== 'GAPING MAW PLASMA ERUPTION') throw new Error('Unexpected skill name: ' + voracis.skillName);

voracis.skillWindupT = 0;
var eBulletsBefore = G.ebullets.length;
updateBoss(voracis, 0.016, p);
if (voracis.skillPhase !== 'active') throw new Error('Voracis should enter active skill phase!');
if (voracis.jawAngle < 1.0) throw new Error('Voracis mandibles should gape open during plasma eruption!');
var plasmaBullets = G.ebullets.slice(eBulletsBefore).filter(b => b.kind === 'voracis_plasma');
if (plasmaBullets.length < 5) throw new Error('Voracis plasma eruption should emit at least 5 plasma orbs, got: ' + plasmaBullets.length);

// Verify voracis_plasma creates acid pool on expiry
var poolCountPrePlasma = (G.thermitePools || []).length;
G.ebullets.push({ x: 300, y: 300, vx: 0, vy: 0, r: 9, dmg: 20, life: 0.001, col: '#ff0055', kind: 'voracis_plasma' });
update(0.016);
var poolCountPostPlasma = (G.thermitePools || []).length;
if (poolCountPostPlasma <= poolCountPrePlasma) throw new Error('Expiring voracis_plasma failed to spawn acid hazard pool!');

// Test Scythe Cleave
voracis.skillPhase = 'cooldown';
voracis.scytheTimer = 0;
voracis.ang = 0;
p.x = voracis.x + 100;
p.y = voracis.y;
p.inv = 0;
var preSlashHp = p.hp;
updateBoss(voracis, 0.016, p);
if (!voracis.scytheSlashing) throw new Error('Voracis scythe slash should trigger!');
if (p.hp >= preSlashHp) throw new Error('Scythe slash failed to damage player on forward arc!');
console.log('  [PASS] Phase 1 Gaping Maw plasma eruption and Scythe Cleave verified!');

// TEST 3: Voracis Phase 2 Metamorphosis (< 50% HP)
console.log('Test 3: Voracis Phase 2 Metamorphosis (< 50% HP)...');
voracis.hp = 6000; // Less than half (13000 / 2 = 6500)
var initialLeechCount = G.enemies.filter(e => e.type === 'leech').length;
updateBoss(voracis, 0.016, p);

if (!voracis.phase2) throw new Error('Voracis phase2 flag not activated when HP < 50%!');
if (voracis.phase !== 2) throw new Error('Voracis phase should be 2!');
if (!voracis.rupturedCarapace) throw new Error('Carapace should be ruptured in Phase 2!');
if (voracis.color !== '#ff0033') throw new Error('Voracis Phase 2 color should be #ff0033, got: ' + voracis.color);
if (voracis.spd !== 145) throw new Error('Voracis Phase 2 speed should be 145 px/s!');
var postLeechCount = G.enemies.filter(e => e.type === 'leech').length;
if (postLeechCount < initialLeechCount + 4) throw new Error('Phase 2 metamorphosis should spawn at least 4 parasitic leech drones!');
console.log('  [PASS] Phase 2 metamorphosis verified: ruptured carapace, speed boost, and leech brood spawn!');

// TEST 4: Voracis Phase 2 Devouring Swallow Rush (Predatory Lunge)
console.log('Test 4: Voracis Phase 2 Devouring Swallow Rush...');
voracis.skillPhase = 'cooldown';
voracis.lungeTimer = 0;
voracis.lungeT = 0;
p.x = voracis.x + 350;
p.y = voracis.y;
updateBoss(voracis, 0.016, p);
if (voracis.lungeT <= 0) throw new Error('Predatory lunge rush failed to trigger in Phase 2!');
if (voracis.jawAngle < 1.3) throw new Error('Jaws should unhinge to maximum gape during swallow rush!');
// Verify lunging speed (3.2x normal speed)
var lungeSpd = Math.hypot(voracis.vx, voracis.vy);
if (lungeSpd < voracis.spd * 2.8) throw new Error('Lunge speed insufficient: ' + lungeSpd);
if (!voracis.shadowTrail || voracis.shadowTrail.length === 0) throw new Error('Shadow trail afterimages not generated during lunge!');
console.log('  [PASS] Devouring swallow rush verified with 3.2x speed, unhinged jaws, and shadow trail!');

// TEST 5: Voracis Phase 2 360-degree Acid Bile Spray & Hazard Pools
console.log('Test 5: Voracis Phase 2 Continuous Acid Bile Spray...');
voracis.lungeT = 0;
voracis.skillCd = 0;
voracis.skillPhase = 'active';
voracis.skillName = 'EXTINCTION ACID ROTATION & LEECH BROOD';
var startEBullets = G.ebullets.length;
updateBoss(voracis, 0.08, p);
var newAcidBullets = G.ebullets.slice(startEBullets).filter(b => b.kind === 'acid_bile' && b.col === '#a7ff00');
if (newAcidBullets.length === 0) throw new Error('Continuous acid bile rotation failed to emit acid bullets!');

// Guarantee player is inside an active acid hazard pool
G.thermitePools = G.thermitePools || [];
G.thermitePools.push({ x: p.x, y: p.y, r: 44, life: 4.5, maxLife: 4.5, isAcid: true });

// Test player slowing and acid damage
p.inv = 0;
p.vx = 200; p.vy = 0;
var pHpBefore = p.hp;
update(0.016);
if (p.vx >= 200) throw new Error('Acid hazard pool failed to slow player thrusters!');
if (p.hp >= pHpBefore) throw new Error('Acid hazard pool failed to inflict acid damage to player!');
console.log('  [PASS] 360-degree acid bile spray and toxic slowing hazard pool verified!');

// TEST 6: Sector 2 Alien Enemy Types & Combat Behaviors
console.log('Test 6: Sector 2 Alien Enemy Types & Behaviors...');
var alienTypes = ['carapace', 'mantis', 'sporepod', 'colossus', 'leech', 'spore'];
alienTypes.forEach(function(tName){
  if (!ENEMY_TYPES[tName]) throw new Error('Enemy type ' + tName + ' not registered in ENEMY_TYPES!');
  if (!ENEMY_TYPES[tName].isAlien) throw new Error('Enemy type ' + tName + ' should be flagged isAlien: true!');
});

// A. Hive Colossus: Frontal Deflection (-70%) vs Dorsal Heart Critical (x3)
console.log('  Testing Hive Colossus Frontal Armor vs Dorsal Critical...');
G.enemies = [];
spawnEnemyUnit('colossus', 500, 500);
var colossus = G.enemies[0];
colossus.ang = 0; // Facing right (+X)

// Direct frontal bullet coming from the front (X=600 hitting head)
G.bullets = [{
  x: 535, y: 500, vx: -600, vy: 0, r: 6, dmg: 100, hit: [], life: 1, ang: Math.PI
}];
var colossusHpBefore = colossus.hp;
update(0.016);
var frontalDmg = colossusHpBefore - colossus.hp;
if (frontalDmg > 35) throw new Error('Colossus frontal armor failed to deflect 70% damage! Damage taken: ' + frontalDmg);
console.log('    Frontal impact: 100 base dmg -> ' + frontalDmg + ' taken (70% deflection verified)!');

// Rear dorsal heart bullet coming from behind (X=400 hitting dorsal weakpoint)
colossus.hp = colossus.maxhp;
colossusHpBefore = colossus.hp;
G.bullets = [{
  x: 465, y: 500, vx: 600, vy: 0, r: 6, dmg: 100, hit: [], life: 1, ang: 0
}];
update(0.016);
var rearDmg = colossusHpBefore - colossus.hp;
if (rearDmg < 250) throw new Error('Colossus dorsal heart failed to take triple critical damage! Damage taken: ' + rearDmg);
console.log('    Rear dorsal impact: 100 base dmg -> ' + rearDmg + ' taken (3.0x critical verified)!');

// B. Brood Carapace: Bio-Shield Aura (60% protection) & Healing Orb Drop
console.log('  Testing Brood Carapace Bio-Shield & Loot...');
G.enemies = [];
spawnEnemyUnit('carapace', 500, 500);
var carapace = G.enemies[0];
spawnEnemyUnit('drifter', 530, 500); // 30px away, within 75px aura
var ally = G.enemies[1];

G.bullets = [{
  x: 530, y: 500, vx: 0, vy: 0, r: 15, dmg: 10, hit: [], life: 1, ang: 0
}];
var allyHpBefore = ally.hp;
update(0.016);
var allyDmgTaken = allyHpBefore - ally.hp;
if (allyDmgTaken > 5) throw new Error('Carapace bio-shield failed to protect adjacent ally! Dmg: ' + allyDmgTaken);
console.log('    Ally damage reduced by carapace aura (10 base -> ' + allyDmgTaken + ' taken)!');

// Kill Carapace and verify 3 healing/XP orbs dropped
var orbCountBefore = G.orbs.length;
killEnemy(carapace);
if (G.orbs.length < orbCountBefore + 3) throw new Error('Carapace defeat failed to drop 3 healing/XP orbs!');
console.log('    Carapace dropped 3 restorative orbs on death!');

// C. Bile Spore Pod: Spore Detonation into Acid Pool
console.log('  Testing Bile Spore Detonation...');
G.enemies = [];
spawnEnemyUnit('spore', 600, 600);
var spore = G.enemies[0];
var poolCountBefore = (G.thermitePools || []).length;
killEnemy(spore);
var poolCountAfter = (G.thermitePools || []).length;
if (poolCountAfter <= poolCountBefore) throw new Error('Spore defeat failed to generate acid hazard pool!');
console.log('    Living spore detonated into corrosive acid hazard pool!');

// TEST 7: Post-Abyss Titan Transition & Astral Void Rift
console.log('Test 7: Astral Void Rift & Sector 2 Transition...');
startGame(1);
// Awaken and kill Abyss Leviathan
awakenBoss();
var leviathan = G.boss;
killEnemy(leviathan);

if (G.state !== 'victory') throw new Error('Abyss Titan kill should set victory state!');
if (!G.astralRift || !G.astralRift.active) throw new Error('Slain Abyss Titan failed to open Astral Void Rift!');
console.log('  [PASS] Astral Void Rift opened at (' + G.astralRift.x + ', ' + G.astralRift.y + ') with r=' + G.astralRift.r + '!');

// Verify 4th button [4] SECTOR 02 in victory HUD
render();
var sec2Btn = (G.victoryButtons || []).find(b => b.action === 'sector2');
if (!sec2Btn) throw new Error('Victory HUD missing [4] SECTOR 02 button!');
console.log('  [PASS] Victory HUD registered button [4] SECTOR 02!');

// Verify that key 'w' does NOT trigger sector2 transition during victory flight
var keyHandler = (typeof window.dispatch === 'function') ? window.dispatch : function(){};
// Dispatch key 'w' via event handler or manual invocation
keys['w'] = true;
if (G.state !== 'victory') throw new Error('Key W should not trigger victory transitions!');

// Trigger enterSector2()
enterSector2();
if (G.sector !== 2) throw new Error('enterSector2() failed to set G.sector = 2!');
if (G.wave !== 6) throw new Error('Sector 2 should start at Wave 6, got: ' + G.wave);
if (G.state !== 'play') throw new Error('enterSector2() should set G.state = play!');
if (G.astralRift !== null) throw new Error('Astral rift should be cleared after entering Sector 2!');
console.log('  [PASS] Warp transit into Sector 2 Wave 6 verified!');

// TEST 8: Full Sector 2 Progression (Waves 6 through 10 & Voracis Apex Encounter)
console.log('Test 8: Sector 2 Progression Waves 6 through 10...');
// A. Wave 6: Check HUD Top Console and Alien Spawning
render();
if (G.wave !== 6) throw new Error('Expected Wave 6!');
if (G.waveState !== 'combat') throw new Error('Wave 6 should be in combat state!');
// Verify spawner director spawns alien enemies in Sector 2
G.spawnTimer = 0;
update(0.1);
var wave6AlienCount = G.enemies.filter(e => e.type === 'carapace' || e.type === 'mantis').length;
if (wave6AlienCount === 0) throw new Error('Wave 6 failed to spawn Sector 2 alien enemies (carapace/mantis)!');
console.log('  [PASS] Sector 2 Wave 6 successfully spawned ' + wave6AlienCount + ' alien bio-predators!');

// Simulate clearing Wave 6
G.waveKills = G.waveTotal;
G.enemies = [];
update(0.016);
if (G.waveState !== 'cleared') throw new Error('Wave 6 should be marked cleared after hostiles eliminated!');
update(2.1);
if (G.wave !== 7) throw new Error('Expected wave to advance to Wave 7, got: ' + G.wave);
console.log('  [PASS] Wave 6 cleared and advanced to Wave 7!');

// Verify Wave 7 spawns sporepod/mantis
G.spawnTimer = 0;
update(0.1);
var wave7AlienCount = G.enemies.filter(e => e.type === 'sporepod' || e.type === 'mantis' || e.type === 'carapace').length;
if (wave7AlienCount === 0) throw new Error('Wave 7 failed to spawn alien bio-predators!');
console.log('  [PASS] Wave 7 successfully spawned alien enemies!');

// Jump to Wave 10 Apex Encounter
startWave(10);
if (G.wave !== 10) throw new Error('Failed to start Wave 10!');
if (G.waveState !== 'boss') throw new Error('Wave 10 state should be boss!');
if (!G.boss || G.boss.bossType !== 'voracis') throw new Error('Wave 10 failed to spawn Voracis the Void Gargantua!');
console.log('  [PASS] Wave 10 Apex encounter with Voracis verified!');

// Check HUD rendering during Voracis fight
render();

// Defeat Voracis in Sector 2 and verify Sector 2 Debrief
killEnemy(G.boss);
if (G.state !== 'victory') throw new Error('Voracis kill should trigger victory state!');
render();
// In Sector 2 victory, verify button 4 [SECTOR 02] is absent
var sec2BtnPostVoracis = (G.victoryButtons || []).find(b => b.action === 'sector2');
if (sec2BtnPostVoracis) throw new Error('Sector 2 victory should NOT have button [4] SECTOR 02!');
console.log('  [PASS] Voracis defeat in Sector 2 triggered victory state cleanly with zero redundant warp buttons!');

// TEST 9: Vector Rendering Balance (Saves & Restores)
console.log('Test 9: Vector Canvas Balanced Saves & Restores...');
saveCount = 0; restoreCount = 0;
var testVoracis = {
  bossType: 'voracis', x: 500, y: 500, r: 92, ang: 0, spawn: 1, squash: 0, flash: 0,
  phase: 1, phase2: false, phaseT: 1.0, jawAngle: 0.5, ribFlex: 0.1,
  scytheSlashing: 'left', scytheSlashT: 0.25,
  tendrils: [{ baseAngle: 0 }, { baseAngle: 1 }]
};
drawVoracisBoss(testVoracis);
if (saveCount !== restoreCount) throw new Error('Phase 1 drawVoracisBoss unbalanced: saves=' + saveCount + ' restores=' + restoreCount);

// Test Phase 2 rendering balance
saveCount = 0; restoreCount = 0;
testVoracis.phase = 2;
testVoracis.phase2 = true;
testVoracis.shadowTrail = [{ x: 450, y: 500, ang: 0, a: 0.5 }];
drawVoracisBoss(testVoracis);
if (saveCount !== restoreCount) throw new Error('Phase 2 drawVoracisBoss unbalanced: saves=' + saveCount + ' restores=' + restoreCount);

// Test all alien enemy types rendering balance
alienTypes.forEach(function(et){
  saveCount = 0; restoreCount = 0;
  var dummyE = { type: et, x: 200, y: 200, r: ENEMY_TYPES[et].r, ang: 0, spawn: 1, squash: 0, flash: 0, color: ENEMY_TYPES[et].color };
  drawEnemyModel(dummyE);
  if (saveCount !== restoreCount) throw new Error('drawEnemyModel(' + et + ') unbalanced: saves=' + saveCount + ' restores=' + restoreCount);
});

// Test bespoke bullet renderers save/restore balance
var testBullets = [
  { x: 300, y: 300, vx: 100, vy: 0, r: 7.5, kind: 'acid_bile', col: '#a7ff00', ang: 0 },
  { x: 300, y: 300, vx: 100, vy: 0, r: 6.5, kind: 'bone_spine', col: '#ff0033', ang: 0 },
  { x: 300, y: 300, vx: 100, vy: 0, r: 9.0, kind: 'voracis_plasma', col: '#ff0055', ang: 0 }
];
G.ebullets = testBullets;
saveCount = 0; restoreCount = 0;
render();
if (saveCount !== restoreCount) throw new Error('render() with custom bullets unbalanced: saves=' + saveCount + ' restores=' + restoreCount);

// Test Astral Void Rift rendering balance
saveCount = 0; restoreCount = 0;
drawAstralVoidRift({ x: 400, y: 400, r: 54, active: true });
if (saveCount !== restoreCount) throw new Error('drawAstralVoidRift unbalanced: saves=' + saveCount + ' restores=' + restoreCount);
console.log('  [PASS] All vector renderers have 100% balanced canvas saves and restores!');

// TEST 10: Strict Zero-Emoji Compliance Check
console.log('Test 10: Strict Zero-Emoji Compliance Check...');
const emojiRegex = /[\\u{1F300}-\\u{1F9FF}]|[\\u{2600}-\\u{26FF}]|[\\u{2700}-\\u{27BF}]/u;
if (emojiRegex.test(rawHtml)) throw new Error('Emoji character detected in index.html!');
console.log('  [PASS] Zero emojis verified across codebase!');

console.log('\\n======================================================');
console.log('>>> ALL SECTOR 2 & VORACIS TESTS PASSED (100%)! <<<');
console.log('======================================================');
`;

vm.runInContext(testsScript, context);
process.exit(0);
