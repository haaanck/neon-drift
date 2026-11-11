---
name: webaudio-sound-synthesis
description: >-
  Zero-asset procedural audio and sound design using the WebAudio API. Procedural synthesis
  of laser blasts, explosions, monster roars, thruster hums, ambient drones, and dynamic
  adaptive combat music. Use when designing sound effects, musical moods, or audio feedback.
---

# WebAudio Procedural Sound Synthesis Guide

This skill details patterns and mathematical recipes for generating zero-asset, high-impact arcade and sci-fi audio purely through the WebAudio API.

---

## 1. WebAudio Graph Architecture

```
[OscillatorNode / AudioBufferSourceNode]
                 ||
         [BiquadFilterNode] (Low-pass / Band-pass / High-pass)
                 ||
            [GainNode] (Volume Envelope ADSR)
                 ||
        [Master GainNode]
                 ||
     [AudioContext.destination]
```

### Context Lifecycle & User Interaction Unlock
Modern browsers require a user interaction (click, keypress, touch) to transition `AudioContext.state` from `'suspended'` to `'running'`:
```javascript
function ensureAudioContext(){
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
```

---

## 2. Core Sound Recipes

### A. Laser & Plasma Fire
Rapid downward exponential frequency sweep using a sawtooth or square oscillator:
```javascript
function playLaser(freqStart, freqEnd, duration){
  var t = audioCtx.currentTime;
  var osc = audioCtx.createOscillator();
  var gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}
```

### B. Explosions & Kinetic Impacts
Filtered white/pink noise buffer combined with a low-frequency sine thump:
```javascript
function playExplosion(duration, bassFreq){
  var t = audioCtx.currentTime;
  var bufferSize = audioCtx.sampleRate * duration;
  var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  var data = buffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++){
    data[i] = Math.random() * 2 - 1;
  }
  var noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  var filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(40, t + duration);

  var gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(t);
  noise.stop(t + duration);
}
```

### C. Alien & Monster Guttural Roar
Detuned dual oscillators (sawtooth + triangle) with frequency modulation (LFO warble) and low-pass sweep:
```javascript
function playAbyssRoar(){
  var t = audioCtx.currentTime;
  var osc1 = audioCtx.createOscillator();
  var osc2 = audioCtx.createOscillator();
  var lfo = audioCtx.createOscillator();
  var lfoGain = audioCtx.createGain();
  var filter = audioCtx.createBiquadFilter();
  var gain = audioCtx.createGain();

  osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(95, t);
  osc2.type = 'triangle'; osc2.frequency.setValueAtTime(98, t); // Detuned

  // LFO modulation for guttural throat flutter
  lfo.frequency.setValueAtTime(14, t);
  lfoGain.gain.setValueAtTime(28, t);
  lfo.connect(osc1.frequency);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, t);
  filter.frequency.linearRampToValueAtTime(120, t + 1.2);

  gain.gain.setValueAtTime(0.35, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

  osc1.connect(filter); osc2.connect(filter);
  filter.connect(gain); gain.connect(masterGain);

  lfo.start(t); osc1.start(t); osc2.start(t);
  lfo.stop(t + 1.2); osc1.stop(t + 1.2); osc2.stop(t + 1.2);
}
```

### D. Heartbeat Tension Sub-Bass (Phase 2 Proximity)
Low-pass filtered sine double-pulse (thump-thump):
- First thump: 55 Hz decaying to 32 Hz over 0.08s.
- Second thump: 50 Hz decaying to 28 Hz over 0.08s after 0.14s delay.

---

## 3. Dynamic Adaptive Music Engine

The procedural music engine schedules notes in advance using an interval scheduler:
- **Tempo Modulation**:
  - Title / Ambient: 96 BPM.
  - Normal Combat (Waves 1-4): 118 BPM.
  - Incursion Overdrive (Wave 5 / Sector 2): 126 BPM.
  - Apex Boss Phase 1: 130 BPM.
  - Apex Boss Phase 2 Metamorphosis: 142 BPM (Maximum tension).
- **Scale Harmonization**:
  - Use minor pentatonic or Aeolian modes (e.g. D minor: D, F, G, A, C) for dark sci-fi / synthwave atmosphere.
- **Muffled Filter on Pause**:
  - Insert a master `BiquadFilterNode` before the destination. On pause, ramp `filter.frequency` down to 350 Hz to create a diegetic underwater/cockpit dampening effect.
