const vm = require('vm');

const makeMockAC = function() {
  let time = 10.0;
  return {
    get currentTime() { return time += 0.05; },
    createGain: () => ({
      connect: () => {},
      gain: {
        value: 1,
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      }
    }),
    createOscillator: () => ({
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      },
      Q: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      }
    }),
    createBufferSource: () => ({
      connect: () => {},
      start: () => {},
      stop: () => {}
    }),
    createBuffer: () => ({
      getChannelData: () => new Float32Array(512)
    }),
    createBiquadFilter: () => ({
      connect: () => {},
      type: 'lowpass',
      frequency: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        setTargetAtTime: () => {}
      },
      Q: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      }
    }),
    destination: {}
  };
};

const sandbox = {
  window: {},
  AudioContext: makeMockAC,
  console: console
};
sandbox.window = sandbox;
vm.createContext(sandbox);

const code = `
var AC = null;
var masterFilter = null;
var masterGain = null;

function actx(){
  if (!AC){
    try {
      var AudioCtx = window.AudioContext || AudioContext;
      AC = new AudioCtx();
      var now = (typeof AC.currentTime === 'number') ? AC.currentTime : 0;
      masterFilter = AC.createBiquadFilter();
      masterFilter.type = 'lowpass';
      if (masterFilter.frequency && masterFilter.frequency.setValueAtTime) {
        masterFilter.frequency.setValueAtTime(3200, now);
      }
      masterGain = AC.createGain();
      if (masterGain.gain && masterGain.gain.setValueAtTime) {
        masterGain.gain.setValueAtTime(0.65, now);
      }
      masterFilter.connect(masterGain);
      masterGain.connect(AC.destination);
    } catch(e){}
  }
  return AC;
}

/* ================= PROCEDURAL SPACE MUSIC ENGINE ================= */
var music = {
  active: false,
  mood: 'title', // 'title', 'combat', 'boss', 'boss_p2', 'victory', 'dead'
  step: 0,
  nextStepT: 0,
  tempo: 116, // Space tempo
  muffled: false,
  _gain: null,
  _filter: null,

  init: function(){
    var a = actx();
    if (!a || this._gain) return;
    try {
      var now = (typeof a.currentTime === 'number') ? a.currentTime : 0;
      this._filter = a.createBiquadFilter();
      this._filter.type = 'lowpass';
      if (this._filter.frequency && this._filter.frequency.setValueAtTime) {
        this._filter.frequency.setValueAtTime(3200, now);
      }
      this._gain = a.createGain();
      if (this._gain.gain && this._gain.gain.setValueAtTime) {
        this._gain.gain.setValueAtTime(0.25, now);
      }
      this._filter.connect(this._gain);
      this._gain.connect(masterGain || a.destination);
    } catch(e){}
  },

  setMood: function(m){
    this.mood = m || 'combat';
    if (m === 'boss_p2') this.tempo = 134;
    else if (m === 'boss') this.tempo = 126;
    else if (m === 'title') this.tempo = 90;
    else if (m === 'victory') this.tempo = 108;
    else this.tempo = 116;
  },

  setMuffled: function(muff){
    this.muffled = !!muff;
    var a = actx();
    if (!a || !this._filter) return;
    var now = (typeof a.currentTime === 'number') ? a.currentTime : 0;
    var targetF = this.muffled ? 280 : 3200;
    try {
      if (this._filter.frequency.setTargetAtTime) {
        this._filter.frequency.setTargetAtTime(targetF, now, 0.08);
      } else if (this._filter.frequency.linearRampToValueAtTime) {
        this._filter.frequency.linearRampToValueAtTime(targetF, now + 0.1);
      } else if (this._filter.frequency.setValueAtTime) {
        this._filter.frequency.setValueAtTime(targetF, now);
      }
    } catch(e){}
  },

  start: function(m){
    this.active = true;
    if (m) this.setMood(m);
    this.init();
    var a = actx();
    this.nextStepT = (a && typeof a.currentTime === 'number') ? a.currentTime : 0;
  },

  stop: function(){
    this.active = false;
  },

  tick: function(dt){
    if (!this.active) return;
    var a = actx();
    if (!a) return;
    var now = (typeof a.currentTime === 'number') ? a.currentTime : 0;
    if (this.nextStepT === 0 || this.nextStepT < now - 0.5) this.nextStepT = now;

    var secPerStep = (60 / this.tempo) / 4; // 16th note
    while (this.nextStepT < now + 0.14){
      this.playStep(this.step, this.nextStepT);
      this.step = (this.step + 1) % 64;
      this.nextStepT += secPerStep;
    }
  },

  playStep: function(s, t){
    var a = actx();
    if (!a || !this._filter) return;
    if (this.mood === 'dead') return;

    if (this.mood === 'title'){
      // Deep Space Ambient Drift
      if (s % 16 === 0) this._playSpacePad(s, t, true);
      if (s % 4 === 0) this._playStellarTwinkle(s, t);
      return;
    }

    // Space Gravity Thud (Cosmic sub-pulse instead of earthly kick)
    var isGravityPulse = false;
    if (this.mood === 'boss_p2') {
      isGravityPulse = (s % 4 === 0) || (s % 16 === 6) || (s % 16 === 14);
    } else if (this.mood === 'boss') {
      isGravityPulse = (s % 4 === 0);
    } else {
      isGravityPulse = (s % 8 === 0) || (s % 16 === 10);
    }
    if (isGravityPulse) this._playGravityThud(t);

    // Cosmic Energy Pulse on beats 2 & 4
    if (s % 8 === 4) this._playCosmicPulse(t);

    // Stardust Shimmer (high-pass cosmic particles)
    if (this.mood !== 'title') this._playStardustShimmer(s, t);

    // Zero-Gravity Sub-Bass Hum
    this._playZeroGBass(s, t);

    // Stellar Pulsar Arpeggiator (Twinkling star cluster pulses)
    if (s % 2 === 0) this._playPulsarArp(s, t);

    // Ethereal Nebula Space Pad every bar (16 steps)
    if (s % 16 === 0) this._playSpacePad(s, t, false);
  },

  _playGravityThud: function(t){
    var a = actx();
    try {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      var f0 = (this.mood === 'boss_p2') ? 110 : 85;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(32, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g);
      g.connect(this._filter || a.destination);
      o.start(t); o.stop(t + 0.24);
    } catch(e){}
  },

  _playCosmicPulse: function(t){
    var a = actx();
    try {
      var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'triangle';
      o.frequency.setValueAtTime(260, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 0.12);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(1400, t);
      f.frequency.exponentialRampToValueAtTime(320, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(f); f.connect(g);
      g.connect(this._filter || a.destination);
      o.start(t); o.stop(t + 0.2);

      // Soft cosmic noise wash
      if (a.createBuffer){
        var dur = 0.14;
        var buf = a.createBuffer(1, Math.floor(dur * 44100), 44100);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++){
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.4));
        }
        var src = a.createBufferSource();
        src.buffer = buf;
        var nf = a.createBiquadFilter();
        nf.type = 'bandpass';
        nf.frequency.setValueAtTime(2200, t);
        var ng = a.createGain();
        ng.gain.setValueAtTime(0.08, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(nf); nf.connect(ng);
        ng.connect(this._filter || a.destination);
        src.start(t);
      }
    } catch(e){}
  },

  _playStardustShimmer: function(s, t){
    var a = actx();
    try {
      var isOpen = (s % 16 === 14);
      var dur = isOpen ? 0.09 : 0.026;
      var vol = (s % 4 === 2) ? 0.045 : (isOpen ? 0.065 : 0.025);
      if (a.createBuffer){
        var buf = a.createBuffer(1, Math.floor(dur * 44100), 44100);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++){
          data[i] = (Math.random() * 2 - 1);
        }
        var src = a.createBufferSource();
        src.buffer = buf;
        var f = a.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.setValueAtTime(isOpen ? 8000 : 9500, t);
        var g = a.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g);
        g.connect(this._filter || a.destination);
        src.start(t);
      }
    } catch(e){}
  },

  _playZeroGBass: function(s, t){
    var a = actx();
    try {
      var roots;
      if (this.mood === 'boss_p2'){
        roots = [55.00, 58.27, 55.00, 49.00]; // Low dark chromatic gravity collapse (A1, Bb1, A1, G1)
      } else if (this.mood === 'boss'){
        roots = [73.42, 69.30, 65.41, 61.74]; // Gravitational singularity descent (D2, C#2, C2, B1)
      } else {
        roots = [73.42, 87.31, 65.41, 98.00]; // Deep celestial progression (D2, F2, C2, G2)
      }
      var bar = Math.floor(s / 16) % roots.length;
      var root = roots[bar];
      var isSync = (s % 16 === 0 || s % 16 === 3 || s % 16 === 6 || s % 16 === 8 || s % 16 === 11 || s % 16 === 14);
      if (!isSync && this.mood !== 'boss_p2') return;

      var freq = (s % 16 === 6 || s % 16 === 14) ? root * 1.5 : root; // Celestial fifth bounce

      var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = (this.mood === 'boss_p2') ? 'sawtooth' : 'triangle';
      o.frequency.setValueAtTime(freq, t);
      f.type = 'lowpass';
      var cutoff = (this.mood === 'boss_p2') ? 600 : 380;
      f.frequency.setValueAtTime(cutoff, t);
      f.frequency.exponentialRampToValueAtTime(140, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime((this.mood === 'boss_p2') ? 0.16 : 0.14, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(f); f.connect(g);
      g.connect(this._filter || a.destination);
      o.start(t); o.stop(t + 0.24);
    } catch(e){}
  },

  _playPulsarArp: function(s, t){
    var a = actx();
    try {
      // Ethereal celestial notes spanning octaves like distant radio pulsars
      var scale = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
      var idx = (s * 3) % scale.length;
      var freq = scale[idx];

      var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.038, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(f); f.connect(g);
      g.connect(this._filter || a.destination);
      o.start(t); o.stop(t + 0.2);
    } catch(e){}
  },

  _playStellarTwinkle: function(s, t){
    var a = actx();
    try {
      var notes = [587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51];
      var freq = notes[(s / 4) % notes.length];
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.032, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
      o.connect(g);
      g.connect(this._filter || a.destination);
      o.start(t); o.stop(t + 0.5);
    } catch(e){}
  },

  _playSpacePad: function(s, t, isChill){
    var a = actx();
    try {
      var bar = Math.floor(s / 16) % 4;
      var chords = [
        [146.83, 220.00, 261.63, 329.63], // Dm9 (D3, A3, C4, E4) - cosmic mystery
        [174.61, 261.63, 329.63, 440.00], // Fmaj7 (F3, C4, E4, A4) - stellar nebula
        [130.81, 196.00, 293.66, 329.63], // C(add9) (C3, G3, D4, E4) - zero gravity
        [196.00, 261.63, 293.66, 349.23]  // Gsus4 (G3, C4, D4, F4) - deep void horizon
      ];
      var chord = chords[bar];
      var dur = (60 / this.tempo) * 4 * 0.96; // 1 full cosmic bar
      for (var ci = 0; ci < chord.length; ci++){
        var o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
        o.type = 'triangle';
        // Gentle celestial detune for vast space chorus effect
        var detune = (ci % 2 === 0 ? 0.35 : -0.28);
        o.frequency.setValueAtTime(chord[ci] + detune, t);
        f.type = 'lowpass';
        f.frequency.setValueAtTime(isChill ? 420 : 620, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(isChill ? 0.026 : 0.036, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(g);
        g.connect(this._filter || a.destination);
        o.start(t); o.stop(t + dur + 0.1);
      }
    } catch(e){}
  }
};

music.start('title');
for (var i = 0; i < 20; i++) music.tick(0.016);
music.setMood('combat');
for (var i = 0; i < 32; i++) music.tick(0.016);
music.setMuffled(true);
for (var i = 0; i < 10; i++) music.tick(0.016);
music.setMuffled(false);
music.setMood('boss');
for (var i = 0; i < 20; i++) music.tick(0.016);
music.setMood('boss_p2');
for (var i = 0; i < 30; i++) music.tick(0.016);
console.log('Procedural Space Music Engine verified cleanly!');
`;

vm.runInContext(code, sandbox);

process.exit(0);
