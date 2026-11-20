import type { Cue } from './CutsceneRunner';
import { mutedPreference, setMutedPreference } from './Save';

class GameAudio {
  private context?: AudioContext;
  private output?: GainNode;
  private ambienceNode?: GainNode;
  private ambienceSources: OscillatorNode[] = [];
  private noise?: AudioBuffer;
  private intensity = 0;
  muted = mutedPreference();

  unlock() {
    try {
      if (!this.context) {
        const AudioConstructor = window.AudioContext ??
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioConstructor) return;
        this.context = new AudioConstructor();
        this.output = this.context.createGain();
        this.output.gain.value = this.muted ? 0 : .55;
        this.output.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
      this.applyAmbience();
    } catch { /* Gameplay remains available on browsers without WebAudio. */ }
  }

  toggle() {
    this.muted = !this.muted;
    setMutedPreference(this.muted);
    if (this.context && this.output) {
      this.output.gain.setTargetAtTime(this.muted ? 0 : .55, this.context.currentTime, .025);
    }
    return this.muted;
  }

  ambience(level: number) {
    this.intensity = level;
    this.applyAmbience();
  }

  private applyAmbience() {
    const context = this.context;
    const output = this.output;
    if (!context || !output) return;
    if (!this.ambienceNode && this.intensity > 0) {
      const bus = context.createGain();
      bus.gain.value = 0;
      bus.connect(output);
      this.ambienceNode = bus;
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 310;
      lowpass.connect(bus);
      for (const [frequency, level] of [[49, .37], [73.5, .19], [98.4, .08]]) {
        const source = context.createOscillator();
        const gain = context.createGain();
        source.type = frequency < 50 ? 'sine' : 'triangle';
        source.frequency.value = frequency;
        gain.gain.value = level;
        source.connect(gain).connect(lowpass);
        source.start();
        this.ambienceSources.push(source);
      }
      const swell = context.createOscillator();
      const amount = context.createGain();
      swell.frequency.value = .18;
      amount.gain.value = .07;
      swell.connect(amount);
      amount.connect(lowpass.Q);
      swell.start();
      this.ambienceSources.push(swell);
    }
    this.ambienceNode?.gain.setTargetAtTime(this.intensity * .11, context.currentTime, .4);
  }

  stopAmbience() {
    this.intensity = 0;
    this.ambienceSources.forEach(source => source.stop());
    this.ambienceSources = [];
    this.ambienceNode?.disconnect();
    this.ambienceNode = undefined;
  }

  play(cue: Cue) {
    if (!this.context || !this.output || this.context.state !== 'running' || this.muted) return;
    switch (cue) {
      case 'step': this.burst(.06, .1, 330, 'lowpass'); break;
      case 'interact': this.tone(275, 320, .09, .1, 'triangle'); break;
      case 'dialogue': this.tone(596, 492, .048, .055); break;
      case 'quest': this.tone(369, 554, .18, .115, 'triangle'); break;
      case 'alert':
        this.tone(525, 178, .26, .22, 'sawtooth');
        this.burst(.23, .17, 440, 'lowpass');
        break;
      case 'gunshot':
        this.burst(.32, .36, 1500, 'lowpass');
        this.tone(91, 34, .38, .24, 'triangle');
        break;
      case 'fall': this.tone(180, 36, .55, .18, 'triangle'); this.burst(.4, .17, 290, 'lowpass'); break;
      case 'impact': this.tone(74, 34, .38, .20); this.burst(.12, .11, 190, 'lowpass'); break;
    }
  }
  private tone(start: number, end: number, seconds: number, volume: number, type: OscillatorType = 'sine') {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const time = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, time);
    oscillator.frequency.exponentialRampToValueAtTime(end, time + seconds);
    this.envelope(oscillator, oscillator, seconds, volume);
  }
  private burst(seconds: number, volume: number, frequency: number, type: BiquadFilterType) {
    const context = this.context!;
    if (!this.noise) {
      this.noise = context.createBuffer(1, Math.ceil(context.sampleRate * .6), context.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    source.connect(filter);
    this.envelope(source, filter, seconds, volume);
  }
  private envelope(source: AudioScheduledSourceNode, last: AudioNode, seconds: number, volume: number) {
    const context = this.context!;
    const time = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, time + seconds);
    last.connect(gain).connect(this.output!);
    source.start(time);
    source.stop(time + seconds);
    source.addEventListener('ended', () => { source.disconnect(); last.disconnect(); gain.disconnect(); }, { once: true });
  }

  get state() { return this.context?.state ?? 'locked'; }
}

export const audio = new GameAudio();
