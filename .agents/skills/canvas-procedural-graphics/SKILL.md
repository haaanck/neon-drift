---
name: canvas-procedural-graphics
description: >-
  Procedural vector graphics, beveled hulls, sub-segment fracture interpolation,
  particle systems, multi-layered shockwaves, lighting/shadows, and Canvas2D rendering
  optimizations for HTML5 games. Use when designing or polishing player ships,
  boss monsters, weapon effects, or HUD graphics.
---

# Canvas Procedural Graphics & Vector Rendering Guide

This skill provides architectural patterns, math formulas, and rendering guidelines for building high-fidelity procedural vector graphics in HTML5 Canvas 2D without external image assets.

---

## 1. Beveled Chassis & Multi-Layered Hulls

To achieve tactile, metallic, or crystalline depth on 2D vector shapes, use a three-pass render pipeline:

1. **Underglow / Silhouette Pass**:
   - Render a slightly enlarged base polygon with semi-transparent primary color and subtle shadow blur (`ctx.shadowBlur = 8..14`, `ctx.shadowColor = col`).
2. **Core Plate Fill Pass**:
   - Fill the inner geometry with a dark structural base tone (`#0a101f` for steel, `#150824` for void chitin).
   - Apply a linear gradient across the axis of motion to emulate ambient specular lighting.
3. **Hard-Light Edge & Specular Bevel Pass**:
   - Stroke the outer perimeter with bright neon hard-light (`lineWidth: 1.5..2.5`, `ctx.strokeStyle = highlightCol`).
   - Add interior panel seam lines connecting vertices to create faceted, armor-plated depth.

```javascript
ctx.save();
ctx.translate(x, y);
ctx.rotate(ang);

// 1. Base underglow
ctx.shadowColor = col;
ctx.shadowBlur = 12;
ctx.fillStyle = 'rgba(10, 16, 32, 0.95)';
ctx.beginPath();
ctx.moveTo(r, 0);
ctx.lineTo(-r * 0.7, r * 0.65);
ctx.lineTo(-r * 0.4, 0);
ctx.lineTo(-r * 0.7, -r * 0.65);
ctx.closePath();
ctx.fill();

// 2. Beveled highlight edge
ctx.shadowBlur = 0;
ctx.strokeStyle = col;
ctx.lineWidth = 2.0;
ctx.stroke();

// 3. Central dorsal spine
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 1.0;
ctx.beginPath();
ctx.moveTo(r * 0.8, 0);
ctx.lineTo(-r * 0.35, 0);
ctx.stroke();

ctx.restore();
```

---

## 2. Anatomical Monster Geometry & Articulated Kinematics

For living cosmic horrors and bio-monsters (e.g. Voracis, Abyss Leviathan):

### A. Triple-Hinged Mandibles
- Define cranial base coordinates and articulate left, right, and dorsal mandibles via dynamic rotation offsets (`jawAngle`).
- Gape jaws open during attack telegraphs and snap shut on impact.
- Render serrated teeth along inner jaw contours using iterative coordinate offsets.

### B. Segmented Serpentine Spines (Forward Kinematics)
- Maintain an array of segment objects `{ x, y, r, ang }`.
- In update: segment `i` trails segment `i - 1` by fixed distance `dist`:
  ```javascript
  var dx = parent.x - seg.x;
  var dy = parent.y - seg.y;
  var d = Math.hypot(dx, dy);
  if (d > dist) {
    seg.x = parent.x - (dx / d) * dist;
    seg.y = parent.y - (dy / d) * dist;
    seg.ang = Math.atan2(dy, dx);
  }
  ```
- Render lateral ribs and dorsal scutes perpendicular to `seg.ang`.

### C. Undulating Trailing Tendrils
- Compute wave offsets using sinusoidal functions of game time:
  ```javascript
  var wave = Math.sin(t * freq + i * phaseOffset) * amplitude;
  ```
- Connect segment points using `ctx.quadraticCurveTo()` for smooth biological whipping motion.

---

## 3. Progressive Crack Propagation & Fracture Mechanics

To render cracking shells, eggs, or armor plates:

1. **Path-Based Branching Trees**:
   - Store fracture paths as arrays of normalized coordinate points `[[x0, y0], [x1, y1], ...]`.
2. **Continuous Sub-Segment Interpolation**:
   - Avoid abrupt discrete jumps. Calculate progress fraction `progress = [0..1]`.
   - Multiply by total path segments to find active segment index and sub-segment fraction `t = frac % 1`.
   - Linearly interpolate: `px = p0.x + (p1.x - p0.x) * t`, `py = p0.y + (p1.y - p0.y) * t`.
3. **Resonance Flash & Ember Ejection**:
   - When cracked parts take damage, spike an impact flash scalar `impactFlash = 1.0` that decays exponentially (`* Math.pow(0.01, dt)`).
   - Render luminous venting fissures with inner core color `#ffffff` and outer glow `#ffe066`.

---

## 4. Weapon Particles, Beams & Shockwaves

### Supersonic Shock Diamonds
- Place diamond coordinates along thrust exhaust trails. Scale width and opacity based on throttle and boost state.

### Plasma Beams & Continuous Lasers
- Render beams in 3 passes:
  1. Wide semi-transparent outer bloom (`lineWidth: 24..36`, `rgba(col, 0.25)`).
  2. Medium focused energy channel (`lineWidth: 10..16`, `rgba(col, 0.75)`).
  3. Hyper-dense white-hot core laser (`lineWidth: 2..4`, `#ffffff`).

### Persistent Hazard Pools (Acid / Thermite)
- Track `{ x, y, r, life, maxLife, isAcid }`.
- Render boiling surface with oscillating radial bubbles and outer sputtering droplets.
- Fade opacity smoothly: `alpha = clamp(life / maxLife, 0, 1)`.

---

## 5. Strict Canvas Stack Safety Rules

1. **Never leak canvas state**: Every `ctx.save()` MUST have a matching `ctx.restore()`.
2. **Defensive coordinate guards**: Always check for `NaN`, `undefined`, or infinite coordinates before calling canvas drawing methods.
3. **Clip isolation**: Wrap all viewport-clipping logic in dedicated `ctx.save()` / `ctx.restore()` blocks so parent renderers are never inadvertently clipped.
4. **Clean typography reset**: Always restore `ctx.textAlign = 'left'` and `ctx.textBaseline = 'alphabetic'` after custom text drawing routines.
