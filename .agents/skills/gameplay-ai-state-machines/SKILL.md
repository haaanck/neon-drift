---
name: gameplay-ai-state-machines
description: >-
  Game architecture for 2D space flight physics, steering behaviors, squad incursion directors,
  multi-phase apex boss state machines, and bullet hell projectile patterns. Use when tuning
  movement feel, balancing combat encounters, or authoring enemy AI.
---

# Gameplay AI & Combat State Machines Guide

This skill details patterns for 2D space physics, AI steering, wave director pacing, and apex boss state machines.

---

## 1. Flight Physics & Vector Steering

### Inertia & Drag Model
Space flight physics combines thrust acceleration with exponential velocity damping:
```javascript
// Acceleration along facing angle
p.vx += Math.cos(p.ang) * thrust * dt;
p.vy += Math.sin(p.ang) * thrust * dt;

// Natural space friction / drag
var drag = Math.pow(0.92, dt * 60);
p.vx *= drag;
p.vy *= drag;

// Integrate position
p.x += (p.vx + p.kx) * dt;
p.y += (p.vy + p.ky) * dt;

// Knockback decay
p.kx *= Math.pow(0.001, dt);
p.ky *= Math.pow(0.001, dt);
```

### Smooth Angular Interpolation (`angLerp`)
Always wrap angle differences through modulo $[-\pi, \pi]$ to avoid 360-degree rotation snaps:
```javascript
function angLerp(a, b, t){
  var d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * clamp(t, 0, 1);
}
```

---

## 2. Squad Incursion Spawner Director

To prevent frame drops and screen clutter while maintaining relentless pressure:

1. **Total Wave Quota vs. Concurrent Cap**:
   - `G.waveTotal`: Total hostiles required to clear the wave.
   - `maxConcurrent`: Clamped limit of live hostiles in the arena (`Math.min(18, 8 + wave * 2)`).
2. **Spawn Cooldown Timer**:
   - Decrement `G.spawnTimer -= dt`. When `<= 0` and `activeMobs < maxConcurrent`, spawn 2-3 units around the arena perimeter outside the camera view.
3. **Paced Wave Progression**:
   - When `waveKills >= waveTotal`, transition `G.waveState = 'cleared'`.
   - Provide a 2.5s battlefield repair breather (healing 25-35 HP) and clear stray enemy bullets.

---

## 3. Apex Boss Multi-Phase State Machine

Bosses operate via a cyclic finite state machine:

```
[Ready / Orbiting] 
       ||
  (skillCd <= 0)
       ||
       \/
[Windup Telegraph] (1.2s - Glowing beacons, mandible flare, sound charge)
       ||
       \/
[Active Execution] (2.5s - Hyper-beams, radial spirals, swallow rush)
       ||
       \/
[Cooldown Recovery] (1.5s - Vulnerability window, smoke puff)
```

### Phase 2 Metamorphosis Trigger (< 50% HP)
When `b.hp <= b.maxhp * 0.50` and `!b.phase2`:
1. Set `b.phase2 = true` and `b.phase = 2`.
2. Clear all active enemy bullets (`G.ebullets = []`).
3. Trigger maximum screen shake (`G.shake = 35`), hitstop (`G.hitstop = 0.3`), and full-screen flash.
4. Increase boss speed (`+30% to +45%`), unlock aggressive signature abilities (e.g. Swallow Rush, Gravitational Singularities, 360-degree Acid Spray).
5. Escalate audio mood to `boss_p2` (142 BPM).

---

## 4. Hostile Archetype Tactical Roles

1. **Swarmer / Drifter**: Direct homing vector, low HP, high quantity.
2. **Splitter**: Medium speed; ruptures into fast fragile shards on death.
3. **Sniper / Shooter**: Maintains standoff distance (250-370px), aims predicted lead shots.
4. **Tank / Brute**: High HP, heavy mass, inflicts high collision damage, absorbs player fire.
5. **Support / Carapace**: Projects protective energy or pheromone dome reducing ally damage.
6. **Ambush / Mantis**: Phase-shifts into sub-space invisibility, re-emerges behind player.
7. **Area Denial / Spore Pod**: Seeds persistent hazard zones that penalize stationary flight.
8. **Juggernaut / Colossus**: Heavy frontal damage reduction (70%), forcing flanking maneuvers to strike vulnerable rear engines.
