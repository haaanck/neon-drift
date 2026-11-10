# Neon Drift - Antigravity Project Rules & Guidelines

This document defines the architectural rules, coding standards, performance constraints, and verification protocols for the Neon Drift codebase. All modifications must adhere strictly to these guidelines.

---

## 1. Core Architecture & Philosophy

- **Self-Contained Single-File Application**: The entire client runs in `index.html` with zero external frontend libraries or asset dependencies. All sprites, audio, animations, and visual effects are procedurally generated in real time using Canvas 2D and the Web Audio API.
- **State Encapsulation**: Global simulation state is stored on the single `G` object. Avoid creating scattered global variables. State resets (`newGame()`, `startGame()`, `goToTitle()`) must properly re-initialize all arrays and sub-objects.
- **Strict Zero-Emoji Policy**: Zero emoji characters are permitted anywhere in the project. This applies to source code, comments, UI text, test runners, git commit messages, and assistant responses.

---

## 2. 60 FPS Performance & Memory (Zero-Allocation Rules)

The game runs at 60 FPS across a 4200x4200 space arena. To prevent V8 Garbage Collection (GC) pauses and frame stutters:

- **Loop Invariants**: Precompute expensive math outside per-frame loops (e.g. `var dragFactor = Math.pow(0.06, dt);` outside the particle loop rather than calling `Math.pow()` hundreds of times per frame).
- **Fast Array Deletion**: For unordered particle, debris, or combat text collections, use O(1) swap-and-pop rather than `Array.prototype.splice()`:
  ```javascript
  G.parts[i] = G.parts[G.parts.length - 1];
  G.parts.pop();
  ```
- **Array Caps**: Strict upper bounds must be enforced on transient entities:
  - `G.parts`: Maximum 450 particles.
  - `G.texts`: Maximum 50 combat texts.
  - `G.orbs`: Maximum 150 EXP orbs.
- **Audio Buffer Reuse**: Never allocate dynamic `AudioBuffer` objects or `Float32Array` buffers on audio ticks (e.g., snares, shimmers, dashes). Always reuse pre-allocated static buffers via `getSharedNoiseBuffer(a)`.
- **Viewport Culling**: Always calculate viewport boundaries at the start of `render()` (`vMinX`, `vMaxX`, `vMinY`, `vMaxY`) and skip drawing off-screen enemies, bullets, orbs, and particles.

---

## 3. Controls, Aiming & Physics Standards

- **Input Separation**:
  - Movement is strictly bound to WASD.
  - Shooting and aiming are bound to Directional Arrow keys (or mobile touch joystick).
  - The mouse cursor must never turn or rotate the player ship model. Mouse interaction is strictly reserved for clicking UI buttons and card selection trays.
- **Direct Target Alignment**: When an enemy is locked via tactical aim assist (`bestTarget && shouldFire`):
  - `p.aim` and bullet `fireAngle` must snap directly to `Math.atan2(bestTarget.y - p.y, bestTarget.x - p.x)`.
  - The player ship heading, laser aiming sight, and projectile trajectory must remain collinear with zero rotational lag or drift.
- **No Involuntary Movement Drift**: Weapon firing recoil must be visual-only (via `p.recoil`) and must not alter physics velocities (`p.vx`, `p.vy`), ensuring the player maintains 100% manual flight control.

---

## 4. UI & HUD Design Standards

- **Non-Intrusive Layout**: Modals and menus must never obstruct live gameplay, boss death animations, or tactical awareness.
  - Upgrades and skill swap options are positioned in a sleek bottom glass tray (`drawBuffTray`).
  - Active skill slot `[Q]` is positioned directly above the radar on the right edge.
  - The victory screen must utilize floating bottom action buttons (`[1] RESTART`, `[2] EXPLORE`, `[3] TITLE`) and a top telemetry banner, keeping the arena, dying boss disintegration, and exploration features 100% visible.
- **Skill Swap Card Display**: When presenting replacement skill cards, always display the exact skill name (e.g. `NOVA`, `LANCE`, `BARRIER`) rather than generic action text like `EQUIP`.
- **Keycap Badges**: UI cards must always display keyboard shortcut indicators (`[1]`, `[2]`, `[3]`, `[Q]`, `[SPACE]`, `[ESC]`) alongside mouse hover hitboxes.

---

## 5. Verification & Testing Protocol

Before committing any changes or concluding a task:
1. Run all automated test suites located in `scratch/`:
   - `test_runner.js`: Full integration, logic, bosses, god mode, skills, progression.
   - `test_player_visual_upgrades.js`: Ship chassis scaling, engines, thrusters, hardware wing sockets.
   - `test_skills_radar_music.js`: Active skill layout, radar positioning, procedural synthwave audio.
   - `test_merged_skills_buffs_space_music.js`: Unified tray, skill names, space music mood transitions.
   - `test_scary_phase2.js`: Abyss Leviathan phase 2 awakening, cataclysm attacks, shadow dash.
   - `test_training_room.js`: Sandbox spawner, god controls, auto-repair, home navigation.
   - `test_victory_boss_death_animation.js`: Boss death supernova, shards, victory HUD buttons.
   - `test_map_exploration_pois.js`: Boost rings, quantum wormholes, salvage pods, mineral clusters.
2. Confirm 100% test pass rate across all suites.
3. Perform a zero-emoji regex audit to ensure zero emojis exist across all code and text.
