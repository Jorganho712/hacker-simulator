// Áudio sintetizado via WebAudio (sem arquivos externos). Só toca após gesto do usuário e respeitando as configurações.

type Sfx = 'boot' | 'key' | 'notify' | 'alert' | 'success' | 'error' | 'unlock' | 'click' | 'scan' | 'level';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicNodes: AudioNode[] = [];
  private pluckTimer: number | null = null;
  private cfg = { sfx: true, sfxVolume: 0.6, music: false, musicVolume: 0.35 };
  private lastKey = 0;

  configure(c: Partial<typeof this.cfg>) {
    this.cfg = { ...this.cfg, ...c };
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(this.cfg.musicVolume * 0.5, this.ctx.currentTime, 0.2);
    if (this.ctx) {
      if (this.cfg.music) this.startMusic();
      else this.stopMusic();
    }
  }

  /** Deve ser chamado em resposta a um clique/tecla. */
  unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.cfg.music) this.startMusic();
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0, slideTo?: number) {
    if (!this.ctx || !this.master || !this.cfg.sfx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * this.cfg.sfxVolume), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  play(name: Sfx) {
    if (!this.ctx || !this.cfg.sfx || this.cfg.sfxVolume <= 0) return;
    switch (name) {
      case 'key': {
        const now = performance.now();
        if (now - this.lastKey < 30) return;
        this.lastKey = now;
        this.tone(900 + Math.random() * 300, 0.03, 'square', 0.05);
        break;
      }
      case 'click': this.tone(660, 0.05, 'square', 0.08); break;
      case 'notify': this.tone(880, 0.12, 'sine', 0.18); this.tone(1320, 0.18, 'sine', 0.14, 0.1); break;
      case 'alert': this.tone(300, 0.2, 'sawtooth', 0.16); this.tone(260, 0.25, 'sawtooth', 0.16, 0.22); break;
      case 'error': this.tone(180, 0.22, 'square', 0.14, 0, 110); break;
      case 'success': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.16, i * 0.09)); break;
      case 'unlock': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.15, i * 0.07)); break;
      case 'level': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.15, i * 0.08)); break;
      case 'scan': this.tone(300, 0.5, 'sine', 0.08, 0, 1200); break;
      case 'boot': [110, 165, 220, 330].forEach((f, i) => this.tone(f, 0.5, 'sawtooth', 0.07, i * 0.18)); break;
    }
  }

  startMusic() {
    if (!this.ctx || !this.master || this.musicGain || !this.cfg.music) return;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, this.cfg.musicVolume * 0.5), ctx.currentTime + 2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 4;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    const nodes: AudioNode[] = [g, filter, lfo, lfoGain];
    [55, 55.4, 82.4, 110.3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = 0.12;
      o.connect(og).connect(filter);
      o.start();
      nodes.push(o, og);
    });
    filter.connect(g).connect(this.master);
    this.musicGain = g;
    this.musicNodes = nodes;
    const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
    const pluck = () => {
      if (!this.ctx || !this.musicGain) return;
      const f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 2 : 1);
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const pg = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      pg.gain.setValueAtTime(0.0001, t);
      pg.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(pg).connect(this.musicGain);
      o.start(t);
      o.stop(t + 2.5);
      this.pluckTimer = window.setTimeout(pluck, 1800 + Math.random() * 3800);
    };
    this.pluckTimer = window.setTimeout(pluck, 1500);
  }

  stopMusic() {
    if (this.pluckTimer) clearTimeout(this.pluckTimer);
    this.pluckTimer = null;
    if (this.musicGain && this.ctx) {
      const g = this.musicGain;
      const nodes = this.musicNodes;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => nodes.forEach((n) => { try { (n as any).stop?.(); n.disconnect(); } catch { /* noop */ } }), 1200);
    }
    this.musicGain = null;
    this.musicNodes = [];
  }
}

export const audio = new AudioEngine();
