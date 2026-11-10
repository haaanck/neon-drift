---
name: neon-drift-dev
description: >-
  Expert engineering and gameplay tuning guide for Neon Drift. Use when modifying game mechanics,
  balancing bosses or active skills, adding procedural visual effects, optimizing Canvas/Audio performance,
  or running automated verification suites.
---

# Neon Drift Development & Balancing Runbook

This skill provides step-by-step procedures for modifying, balancing, and testing Neon Drift.

---

## 1. Active Skill Architecture

Active skills are registered in the `ACTIVE_SKILLS` array in `index.html`. Each skill object must define:
- `id`: Unique lowercase identifier (e.g., `nova`, `timewarp`, `laser`, `barrier`, `vortex`, `missiles`, `tesla`, `glaives`, `decoy`, `warpstrike`).
- `name`: Display title in uppercase (e.g., `NOVA`, `LANCE`, `BARRIER`).
- `col`: Neon theme hex color (e.g., `#35f0ff`, `#ffe066`, `#3ddc97`).
- `cd`: Base cooldown in seconds.
- `icon`: Vector icon name drawn by `drawIcon()` (e.g., `sparkle`, `bolt`, `crosshair`, `shield`, `vortex`, `radar`, `chip`, `heart`).
- `activate(p)`: Trigger logic executed when the player presses `Q`. Must trigger appropriate procedural audio (`sound.skillNova()`, etc.) and visual shockwaves or bursts.

When adding or adjusting skills:
1. Ensure the skill is supported in `drawPlayerHardwareMounts()` so the player ship displays visual wing adapters.
2. Verify that `dropRandomSkillCore(x, y)` includes the skill in its random drop pool.
3. Verify that God Mode modal includes the skill button for immediate testing.

---

## 2. Apex Boss Development & Balancing

Apex bosses follow a two-phase state machine defined in `updateBoss(e, dt, p)`:
- **Phase 1 (HP > 50%)**: Dormant stasis egg until Level 10 or Wave 5 completion. Once awakened, engages with signature hyper-beam attacks and tactical minion waves.
- **Phase 2 (HP <= 50%)**: Metamorphosis trigger with `sound.abyssRoar()`, screen flash, intense shake, color shift, accelerated heartbeat audio, and enrage mechanics (e.g., `eclipse_cataclysm` gravitational singularities, `shadow_phase_dash`).

### Key Boss Tuning Metrics
- **Abyss Leviathan**: 7500 HP, 16 articulated segments.
- **Aegis Prime**: 4200 HP, kinetic barrier deflection.
- **Void Reaper**: 3600 HP, orbital vortex stream.
- **Polygon Overmind**: 4500 HP, geometric cluster laser grid.
- **Volt Colossus**: 4400 HP, lightning arc conduits.
- **Solar Phoenix**: 4000 HP, thermobaric radial rings.
- **Nexus Overlord**: 5200 HP, minion swarm recursion.

---

## 3. Automated Verification Runbook

All changes must be verified using the test runner scripts before deployment.

### Running Test Suites
Execute the following commands in the terminal:

```bash
# 1. Main Integration & Bosses Suite
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_runner.js"

# 2. Player Visual Upgrades & Hardware Mounts
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_player_visual_upgrades.js"

# 3. Active Skills, Radar & Audio
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_skills_radar_music.js"

# 4. Merged Trays & Space Music
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_merged_skills_buffs_space_music.js"

# 5. Scary Phase 2 Apex Leviathan
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_scary_phase2.js"

# 6. Training Room & God Mode
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_training_room.js"

# 7. Victory Screen & Boss Death Supernova
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_victory_boss_death_animation.js"

# 8. Interactive Map POIs & Features
node "C:\Users\Solicode\.gemini\antigravity\brain\c4882e34-09d7-4cdb-ba79-c6acca73f408\scratch\test_map_exploration_pois.js"
```

### Zero-Emoji Compliance Check
Verify that zero emoji characters exist in `index.html`:
```bash
node -e "const fs = require('fs'); const html = fs.readFileSync('index.html', 'utf8'); const regex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u; const m = html.match(new RegExp(regex, 'gu')); if (m) { console.error('FAILED:', m); process.exit(1); } else { console.log('PASSED: 0 emojis'); }"
```
