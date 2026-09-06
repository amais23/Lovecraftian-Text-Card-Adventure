/**
 * 克蘇魯文字卡牌冒險 - 音效引擎 (Audio Manager)
 * 整合 Kenney.nl CC0 音效風格之 Web Audio API 程序化音效合成器
 * 具備：零外部依賴、零延遲、自適應音量調節與一鍵全域靜音
 */

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lovecraft_card_muted');
      this.isMuted = saved === 'true';
    }
  }

  /**
   * 延遲初始化 AudioContext，遵循瀏覽器使用者互動播放規範
   */
  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lovecraft_card_muted', String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * 1. 抽牌 / 洗牌滑動音 (Kenney Card Slide / Flick)
   */
  public playDrawCard(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450 + Math.random() * 50, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(3, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * 2. 卡牌懸浮微聲 (Card Hover Lift)
   */
  public playCardHover(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * 3. 打出卡牌音效（依據五色卡牌類型具備專屬音色）
   */
  public playCardPlay(category: 'combat' | 'skill' | 'magic' | 'truth' | 'madness'): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;

    switch (category) {
      case 'combat': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.16);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'skill': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.14);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }

      case 'magic': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(320, t);
        osc1.frequency.exponentialRampToValueAtTime(740, t + 0.22);
        osc2.frequency.setValueAtTime(324, t);
        osc2.frequency.exponentialRampToValueAtTime(746, t + 0.22);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.22);
        osc2.stop(t + 0.22);
        break;
      }

      case 'truth': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046, t);
        osc.frequency.exponentialRampToValueAtTime(1318, t + 0.25);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }

      case 'madness': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(110, t);
        osc1.frequency.linearRampToValueAtTime(155.56, t + 0.2);
        osc2.frequency.setValueAtTime(113, t);
        osc2.frequency.linearRampToValueAtTime(158, t + 0.2);

        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.22);
        osc2.stop(t + 0.22);
        break;
      }
    }
  }

  /**
   * 4. 受到傷害 / 撕咬打擊聲 (Damage Take / Hit)
   */
  public playDamage(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * 5. 羊皮紙按鈕點擊聲 (Parchment Click)
   */
  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.035);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  /**
   * 6. 打字機鍵盤微敲擊聲 (Typewriter tick)
   */
  public playTypewriterKey(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600 + Math.random() * 400, t);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.02);
  }
}

export const soundEngine = new SoundEngine();
