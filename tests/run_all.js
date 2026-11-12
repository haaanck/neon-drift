const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================================');
console.log('>>> NEON DRIFT: AUTOMATED MASTER REGRESSION RUNNER <<<');
console.log('========================================================');

const tests = [
  'test_runner.js',
  'test_player_visual_upgrades.js',
  'test_skills_radar_music.js',
  'test_merged_skills_buffs_space_music.js',
  'test_scary_phase2.js',
  'test_training_room.js',
  'test_victory_boss_death_animation.js',
  'test_map_exploration_pois.js',
  'test_egg_rework.js',
  'test_voracis_sector2.js',
  'test_v2_new_skills.js'
];

let failed = 0;

tests.forEach((t, i) => {
  const p = path.resolve(__dirname, t);
  console.log(`\n[${i + 1}/${tests.length}] Running ${t}...`);
  try {
    const out = execSync(`node "${p}"`, { encoding: 'utf8' });
    console.log(out.trim());
    console.log(`PASS: ${t}`);
  } catch (err) {
    console.error(`FAIL: ${t}`);
    console.error(err.stdout || err.message);
    failed++;
  }
});

console.log('\n========================================================');
if (failed === 0) {
  console.log(`>>> ALL ${tests.length} TEST SUITES PASSED (100%)! <<<`);
  console.log('========================================================');
  process.exit(0);
} else {
  console.error(`>>> ${failed} TEST SUITE(S) FAILED! <<<`);
  console.log('========================================================');
  process.exit(1);
}
