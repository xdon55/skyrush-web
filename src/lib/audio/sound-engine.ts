/**
 * SkyRush Procedural Sound Engine
 * ------------------------------------------------------------
 * Uses the Web Audio API to synthesise every game sound at runtime.
 * No audio files are downloaded, so there is zero network cost and
 * no licensing concerns, while still delivering a premium soundscape.
 */

type EngineState = "stopped" | "running";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Ambient music nodes
  private musicNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private musicTimer: number | null = null;
  private musicOn = false;
  private musicStep = 0;

  // Continuous jet engine nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineNoise: AudioBufferSourceNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineState: EngineState = "stopped";

  private enabled = true;
  private volume = 0.7;
  private unlocked = false;

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;

      this.ctx = new Ctor();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.masterGain);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.masterGain);
    }

    return this.ctx;
  }

  /** Must be called from a user gesture to satisfy browser autoplay rules. */
  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    this.unlocked = true;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopEngine();
      this.stopMusic();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        enabled ? this.volume : 0,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  private get ready(): boolean {
    return this.enabled && this.unlocked && !!this.ensureContext();
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  private makeNoiseBuffer(seconds = 2): AudioBuffer | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Short synthesised tone with an ADSR-ish envelope. */
  private tone(opts: {
    freq: number;
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    attack?: number;
    filterFreq?: number;
  }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const {
      freq,
      endFreq,
      duration,
      type = "sine",
      gain = 0.3,
      delay = 0,
      attack = 0.008,
      filterFreq,
    } = opts;

    const t0 = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFreq),
        t0 + duration
      );
    }

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    let tail: AudioNode = osc;
    if (filterFreq) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filterFreq;
      osc.connect(f);
      tail = f;
    }

    tail.connect(g);
    g.connect(this.sfxGain);

    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Filtered noise burst — used for whooshes and impacts. */
  private noise(opts: {
    duration: number;
    gain?: number;
    delay?: number;
    startFreq?: number;
    endFreq?: number;
    type?: BiquadFilterType;
    q?: number;
  }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const {
      duration,
      gain = 0.2,
      delay = 0,
      startFreq = 800,
      endFreq = 200,
      type = "bandpass",
      q = 1,
    } = opts;

    const buffer = this.makeNoiseBuffer(Math.max(0.4, duration));
    if (!buffer) return;

    const t0 = ctx.currentTime + delay;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(startFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFreq),
      t0 + duration
    );

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    src.start(t0);
    src.stop(t0 + duration + 0.05);
  }

  // ----------------------------------------------------------
  // Ambient background music
  // ----------------------------------------------------------

  /**
   * A slow, cinematic pad built from a sustained drone plus a gentle
   * arpeggio that drifts through a minor-9th chord. Entirely synthesised
   * so it loops forever without repetition artefacts or asset downloads.
   */
  startMusic() {
    if (!this.enabled || !this.unlocked) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain || this.musicOn) return;

    this.musicOn = true;
    this.musicStep = 0;

    // --- Sustained drone: two detuned saws through a soft lowpass ---
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 420;
    droneFilter.Q.value = 0.7;

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.16;

    [55, 82.41].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = f;
      osc.detune.value = i === 0 ? -6 : 5;

      // Slow LFO on the detune keeps the pad alive and breathing.
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.05 + i * 0.03;
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 7;
      lfo.connect(lfoAmt);
      lfoAmt.connect(osc.detune);
      lfo.start();

      osc.connect(droneGain);
      osc.start();
      this.musicNodes.push(osc, lfo);
    });

    droneGain.connect(droneFilter);
    droneFilter.connect(this.musicGain);

    // Slow filter sweep for movement.
    const sweep = ctx.createOscillator();
    sweep.type = "sine";
    sweep.frequency.value = 0.03;
    const sweepAmt = ctx.createGain();
    sweepAmt.gain.value = 190;
    sweep.connect(sweepAmt);
    sweepAmt.connect(droneFilter.frequency);
    sweep.start();
    this.musicNodes.push(sweep);

    // --- Arpeggio: soft bell tones over an Am9 voicing ---
    const scale = [220, 261.63, 329.63, 392, 493.88, 587.33];
    const pattern = [0, 2, 4, 3, 1, 4, 5, 2];

    const playNote = () => {
      if (!this.musicOn || !this.ctx || !this.musicGain) return;
      const c = this.ctx;
      const idx = pattern[this.musicStep % pattern.length];
      // Alternate octaves for a wandering feel.
      const oct = this.musicStep % 16 >= 8 ? 2 : 1;
      const freq = scale[idx] * oct;

      const osc = c.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;

      const g = c.createGain();
      const t = c.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1500;

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 2.8);

      this.musicStep += 1;
    };

    playNote();
    this.musicTimer = window.setInterval(playNote, 1750);

    // Gentle fade-in so music never startles the player.
    this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
  }

  stopMusic(fade = 1.2) {
    const ctx = this.ctx;
    this.musicOn = false;

    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    if (ctx && this.musicGain) {
      const t = ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
      this.musicGain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    }

    const stopAt = (ctx?.currentTime ?? 0) + fade + 0.1;
    this.musicNodes.forEach((n) => {
      try {
        n.stop(stopAt);
      } catch {
        /* already stopped */
      }
    });
    this.musicNodes = [];
  }

  /** Ducks the music while the round is in flight so SFX stay clear. */
  setMusicDuck(ducked: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain || !this.musicOn) return;
    this.musicGain.gain.setTargetAtTime(ducked ? 0.2 : 0.5, ctx.currentTime, 0.6);
  }

  isMusicOn() {
    return this.musicOn;
  }

  // ----------------------------------------------------------
  // Continuous jet engine (plays while the plane is flying)
  // ----------------------------------------------------------

  startEngine() {
    if (!this.ready) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.engineGain || this.engineState === "running") return;

    // Two detuned saw oscillators give a turbine-like body.
    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = "sawtooth";
    this.engineOsc1.frequency.value = 62;

    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = "sawtooth";
    this.engineOsc2.frequency.value = 93;

    // Air rush noise layer.
    const noiseBuf = this.makeNoiseBuffer(3);
    this.engineNoise = ctx.createBufferSource();
    if (noiseBuf) this.engineNoise.buffer = noiseBuf;
    this.engineNoise.loop = true;

    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 700;
    this.engineFilter.Q.value = 3;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.18;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineNoise.connect(noiseGain);
    noiseGain.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineNoise.start();

    // Fade in so takeoff feels smooth rather than abrupt.
    this.engineGain.gain.cancelScheduledValues(ctx.currentTime);
    this.engineGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.engineGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.6);

    this.engineState = "running";
  }

  /** Ties engine pitch/brightness to the live multiplier for rising tension. */
  updateEngine(multiplier: number) {
    if (this.engineState !== "running") return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const climb = Math.min(1, Math.log(Math.max(1, multiplier)) / Math.log(30));

    if (this.engineOsc1) {
      this.engineOsc1.frequency.setTargetAtTime(62 + climb * 150, t, 0.12);
    }
    if (this.engineOsc2) {
      this.engineOsc2.frequency.setTargetAtTime(93 + climb * 205, t, 0.12);
    }
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(700 + climb * 2600, t, 0.12);
    }
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0.16 + climb * 0.1, t, 0.2);
    }
  }

  stopEngine(fade = 0.25) {
    const ctx = this.ensureContext();
    if (!ctx || this.engineState !== "running") return;

    const t = ctx.currentTime;
    if (this.engineGain) {
      this.engineGain.gain.cancelScheduledValues(t);
      this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, t);
      this.engineGain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    }

    const stopAt = t + fade + 0.05;
    try {
      this.engineOsc1?.stop(stopAt);
      this.engineOsc2?.stop(stopAt);
      this.engineNoise?.stop(stopAt);
    } catch {
      /* already stopped */
    }

    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineNoise = null;
    this.engineFilter = null;
    this.engineState = "stopped";
  }

  // ----------------------------------------------------------
  // One-shot game sounds
  // ----------------------------------------------------------

  /** UI button press. */
  click() {
    if (!this.ready) return;
    this.tone({ freq: 620, endFreq: 420, duration: 0.06, type: "square", gain: 0.09 });
  }

  /** Bet accepted — confident two-note confirmation. */
  betPlaced() {
    if (!this.ready) return;
    this.tone({ freq: 440, duration: 0.1, type: "triangle", gain: 0.18 });
    this.tone({ freq: 660, duration: 0.16, type: "triangle", gain: 0.16, delay: 0.07 });
  }

  /** Bet cancelled — soft downward blip. */
  betCancelled() {
    if (!this.ready) return;
    this.tone({ freq: 400, endFreq: 240, duration: 0.14, type: "sine", gain: 0.14 });
  }

  /** Countdown tick during the betting window. */
  tick(final = false) {
    if (!this.ready) return;
    this.tone({
      freq: final ? 900 : 620,
      duration: final ? 0.14 : 0.05,
      type: "square",
      gain: final ? 0.16 : 0.08,
    });
  }

  /** Jet takeoff — rising whoosh plus a thrust swell. */
  takeoff() {
    if (!this.ready) return;
    this.noise({ duration: 0.85, gain: 0.3, startFreq: 220, endFreq: 2400, q: 0.8 });
    this.tone({ freq: 110, endFreq: 420, duration: 0.8, type: "sawtooth", gain: 0.14, filterFreq: 1200 });
  }

  /** Milestone crossed (2x, 5x, 10x...) — bright confidence ping. */
  milestone(level: number) {
    if (!this.ready) return;
    const base = 660 + Math.min(level, 6) * 90;
    this.tone({ freq: base, duration: 0.1, type: "triangle", gain: 0.14 });
    this.tone({ freq: base * 1.5, duration: 0.14, type: "sine", gain: 0.1, delay: 0.06 });
  }

  /** Player cashed out — rewarding ascending arpeggio + shimmer. */
  cashout(multiplier: number) {
    if (!this.ready) return;

    // Major arpeggio, scaled brighter for bigger wins.
    const root = 523.25; // C5
    const notes = [1, 1.26, 1.5, 2]; // root, maj3, 5th, octave
    notes.forEach((ratio, i) => {
      this.tone({
        freq: root * ratio,
        duration: 0.3,
        type: "triangle",
        gain: 0.17,
        delay: i * 0.065,
      });
    });

    // Extra octave sparkle for big multipliers.
    if (multiplier >= 5) {
      notes.forEach((ratio, i) => {
        this.tone({
          freq: root * ratio * 2,
          duration: 0.35,
          type: "sine",
          gain: 0.1,
          delay: 0.28 + i * 0.05,
        });
      });
    }

    // Coin shimmer.
    this.noise({ duration: 0.5, gain: 0.09, startFreq: 5200, endFreq: 2400, type: "highpass", delay: 0.05 });
  }

  /** Large win stinger layered on top of the cashout sound. */
  bigWin() {
    if (!this.ready) return;
    const root = 523.25;
    [0, 0.09, 0.18, 0.27, 0.36].forEach((d, i) => {
      this.tone({ freq: root * Math.pow(1.2, i), duration: 0.5, type: "sawtooth", gain: 0.08, delay: d, filterFreq: 3000 });
    });
    this.noise({ duration: 0.9, gain: 0.12, startFreq: 6000, endFreq: 1200, type: "highpass" });
  }

  /** Plane flew away / round crashed — descending sweep and impact. */
  flyAway() {
    if (!this.ready) return;

    this.stopEngine(0.18);

    // Doppler-style departure.
    this.noise({ duration: 0.7, gain: 0.26, startFreq: 2600, endFreq: 180, q: 0.7 });
    // Falling tone.
    this.tone({ freq: 420, endFreq: 70, duration: 0.65, type: "sawtooth", gain: 0.16, filterFreq: 1400 });
    // Low thud.
    this.tone({ freq: 90, endFreq: 45, duration: 0.4, type: "sine", gain: 0.22, delay: 0.04 });
  }

  /** Bet lost — subtle, non-punishing negative cue. */
  lose() {
    if (!this.ready) return;
    this.tone({ freq: 300, endFreq: 180, duration: 0.28, type: "triangle", gain: 0.12 });
  }

  dispose() {
    this.stopEngine(0.05);
    this.stopMusic(0.05);
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
