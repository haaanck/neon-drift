---
name: neon-drift-dev
description: >-
  Expert engineering and gameplay tuning guide for Neon Drift. Use when modifying game mechanics,
  balancing bosses or active skills, adding procedural visual effects, optimizing Canvas/Audio performance,
  or running automated verification suites.
---

# Neon Drift Master Development & Balancing Runbook

This skill provides step-by-step procedures for modifying, balancing, and testing Neon Drift across Sector 1 (The Void Cradle) and Sector 2 (The Deep Astral Trench).

---

## 1. Modular Skills Directory

Neon Drift development is supported by 4 specialized sub-skills in `.agents/skills/`:
- `canvas-procedural-graphics`: Vector ship/monster rendering, bevels, shockwaves, fracture interpolation.
- `webaudio-sound-synthesis`: Zero-asset procedural SFX, monster roars, laser sweeps, adaptive combat music.
- `gameplay-ai-state-machines`: Space flight physics, squad incursion spawner director, boss phase logic.
- `canvas-performance-profiling`: 60 FPS optimization, garbage collection elimination, headless test suites.

---

## 2. Active Skill Architecture

Active skills are registered in the `ACTIVE_SKILLS` dictionary in `index.html`. Each skill object defines:
- `id`: Unique identifier (e.g., `nova`, `timewarp`, `laser`, `barrier`, `vortex`, `missiles`, `tesla`, `glaives`, `decoy`, `warpstrike`).
- `name`: Display title in uppercase.
- `col`: Neon theme hex color.
- `cd`: Base cooldown in seconds.
- `icon`: Vector icon name drawn by `drawIcon()`.
- `activate(p)`: Trigger logic executed when the player presses `Q`. Must trigger appropriate procedural audio and visual shockwaves.

### Registration Checklist:
1. Ensure the skill is supported in `drawPlayerHardwareMounts()` so the player craft displays visual wing adapters.
2. Verify `dropRandomSkillCore(x, y)` includes the skill in its random drop pool.
3. Verify that the God Mode modal includes the skill button for immediate testing.

---

## 3. Apex Boss Development & Balancing

Apex bosses follow a two-phase state machine defined in `updateBoss(e, dt, p)`:
- **Phase 1 (HP > 50%)**: Signature beam attacks, tactical minion waves, defensive posture.
- **Phase 2 (HP <= 50%)**: Metamorphosis trigger with `sound.abyssRoar()`, screen flash, intense shake, color shift, accelerated heartbeat audio, and enrage mechanics.

### Boss Catalog Roster
- **Abyss Leviathan (Sector 1 Apex)**:
  - 7500 HP, 16 articulated segments.
  - Phase 1: Titan Void Hyper-Beam.
  - Phase 2: Apex Eclipse Cataclysm (dual scissoring omega-beams + gravitational singularities + shadow phase-dash).
- **Voracis the Void Gargantua (Sector 2 Apex)**:
  - 13000 HP, articulated triple-hinged mandibles, breathing ribcage, scythe limbs, 8 tendrils.
  - Phase 1: Gaping Maw plasma deluge (lingering corrosive acid pools) and raptorial scythe cleave.
  - Phase 2: Carapace rupture, 3.2x predatory swallow rush, 360-degree rotating acid bile spray, and parasitic leech broods.

---

## 4. Sector Progression Architecture

```
SECTOR 01: THE VOID CRADLE                 SECTOR 02: THE DEEP ASTRAL TRENCH
[Waves 1-5: Swarm Incursion]               [Waves 6-9: Bio-Predator Fleet]
             |                                          |
[Egg Fractures -> Hatching]                             |
             |                                          |
[APEX BOSS: Abyss Leviathan]                            |
             |                                          |
     [ASTRAL VOID RIFT]                                 |
             +----------------------------------------->+
                                                        |
                                           [APEX BOSS: Voracis the Void Gargantua]
```

### Sector 2 Alien Hostile Roster:
- `carapace`: Brood Carapace (310 HP) - Trilobite bio-protector projecting living barrier aura.
- `mantis`: Phase-Stalker Mantis (175 HP) - Sinuous sub-space ambush hunter.
- `spore`: Bile Spore Pod (230 HP) - Floating medusa releasing proximity toxic acid spores.
- `colossus`: Hive Colossus (720 HP) - Armored horned ram with 70% frontal deflection and vulnerable dorsal heart.

---

## 5. Automated Verification Runbook

All changes must be verified using the test runner scripts before deployment.

### Running Test Suites
Execute the master runner in the terminal:
```bash
node tests/run_all.js
```

This executes all 10 automated regression suites:
1. `tests/test_runner.js`: Main integration, God Mode, wave warp, stasis egg hatching.
2. `tests/test_player_visual_upgrades.js`: Player model, 18 buff modules, 10 skill mounts.
3. `tests/test_skills_radar_music.js`: Active skill tray, minimap radar alignment, audio moods.
4. `tests/test_merged_skills_buffs_space_music.js`: Unified bottom tray, level-up queue.
5. `tests/test_scary_phase2.js`: Abyss Leviathan Phase 2 enrage & singularities.
6. `tests/test_training_room.js`: Sandbox room, targeting dummy, god overrides.
7. `tests/test_victory_boss_death_animation.js`: Boss supernova explosion & debrief cards.
8. `tests/test_map_exploration_pois.js`: Wormholes, salvage pods, asteroids, minimap icons.
9. `tests/test_egg_rework.js`: Biomechanical egg geometry, sub-segment cracks, deflection resonance.
10. `tests/test_voracis_sector2.js`: Voracis boss, Sector 2 progression, alien mob behaviors, acid hazards.

### Zero-Emoji Compliance Check
Verify that zero emoji characters exist across the codebase:
```bash
node -e "const fs = require('fs'); const re = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u; ['index.html', 'tests/run_all.js', 'tests/test_voracis_sector2.js'].forEach(f => { const txt = fs.readFileSync(f, 'utf8'); const m = txt.match(re); if (m) { console.error('Emoji found in ' + f + ': ' + m[0]); process.exit(1); } }); console.log('STRICT ZERO-EMOJI POLICY 100% VERIFIED!');"
```
