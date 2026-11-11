---
name: canvas-performance-profiling
description: >-
  Performance optimization and profiling guide for 60fps HTML5 Canvas games.
  Covers object pooling, garbage collection elimination, render-loop budgeting,
  device pixel ratio clamping, and automated regression verification.
---

# Canvas Performance Optimization & Profiling Guide

This skill details techniques for maintaining rock-solid 60 FPS performance in Neon Drift and HTML5 Canvas games across desktop and mobile devices.

---

## 1. Eliminating Garbage Collection Pauses

Garbage collection spikes cause frame stutters. To achieve zero-allocation runtime:

1. **Avoid In-Loop Object Creation**:
   - Never instantiate `{ x, y }`, arrays, or regex inside `update()` or `render()`.
   - Pre-allocate static math vectors and reuse scratch coordinates:
     ```javascript
     // BAD (allocates on every call):
     return { x: cos * r, y: sin * r };

     // GOOD (reuses scratch object or passes raw coordinates):
     scratchVec.x = cos * r; scratchVec.y = sin * r;
     ```
2. **Entity Array In-Place Compaction**:
   - Avoid creating new arrays with `.filter()` during high-frequency loops.
   - Iterate backward and use `.splice(i, 1)`:
     ```javascript
     for (var i = G.bullets.length - 1; i >= 0; i--){
       var b = G.bullets[i];
       b.life -= dt;
       if (b.life <= 0){
         G.bullets.splice(i, 1);
       }
     }
     ```
3. **Pre-Cached Gradient and Style Strings**:
   - Pre-create radial gradients on resize or init rather than calling `ctx.createRadialGradient()` on every animation frame.
   - Reuse fixed hex color strings (`#35f0ff`, `#ffe066`) instead of allocating dynamic template literals.

---

## 2. Canvas2D Rendering Optimizations

1. **Limit ShadowBlur**:
   - `ctx.shadowBlur` is one of the most expensive Canvas2D operations because it invokes a Gaussian blur rasterizer.
   - Disable shadow blur (`ctx.shadowBlur = 0`) before rendering dense bullet swarms or particle clouds.
   - Reserve glow blur strictly for player ships, boss cores, and major weapon detonations.
2. **Device Pixel Ratio (DPR) Clamping**:
   - On high-density mobile screens (DPR 3x or 4x), rasterizing full-screen canvases burns significant GPU fillrate.
   - Clamp DPR to a maximum of 2.0:
     ```javascript
     DPR = Math.min(window.devicePixelRatio || 1, 2.0);
     ```
3. **Pixel Coordinate Rounding for UI Text**:
   - Sub-pixel text rendering triggers continuous antialiasing passes.
   - Pass rounded coordinates (`Math.round(x)`, `Math.round(y)`) to `ctx.fillText()` and HUD rectangles.

---

## 3. Frame Pacing & Delta Time Management

1. **Delta Time Clamping**:
   - If the browser tab loses focus, `dt` can spike to several seconds upon return, causing entities to tunnel through boundaries.
   - Always clamp frame delta:
     ```javascript
     var dt = Math.min(0.05, (now - lastTime) / 1000);
     ```
2. **Hitstop Game Feel**:
   - When large critical impacts or boss phase shifts occur, set `G.hitstop = 0.08..0.25`.
   - While `G.hitstop > 0`, decrement timer and skip physics integration while continuing camera shake and screen flashes.

---

## 4. Headless Automated Regression Testing

Neon Drift uses Node.js VM execution with mocked Canvas2D contexts for headless testing.

### Test Architecture Checklist
- Every new feature or entity must have a corresponding test suite in `tests/`.
- Mock canvas must track `saveCount` and `restoreCount` to catch stack leaks:
  ```javascript
  if (saves !== restores){
    throw new Error('Canvas save/restore mismatch! Saves: ' + saves + ' Restores: ' + restores);
  }
  ```
- Run the master suite with:
  ```bash
  node tests/run_all.js
  ```
- All test suites must pass at 100% before committing.
