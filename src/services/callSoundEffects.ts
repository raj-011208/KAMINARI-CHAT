/**
 * High-tech synthesized Audio Effects for Kaminari Calling
 * Built with Web Audio API for 100% reliable zero-dependency playback.
 */

class CallSoundEffects {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private dialtoneInterval: any = null;
  private isRinging = false;
  private isDialing = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      return null;
    }
  }

  /**
   * Incoming Ringtone (Dual-frequency cyber chime pulse)
   */
  startIncomingRingtone(): void {
    if (this.isRinging) return;
    this.isRinging = true;

    const playTone = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Dual oscillator pulse (480Hz + 520Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(520, now);
      osc2.frequency.setValueAtTime(660, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);

      // Second beep in rapid succession
      const now2 = now + 0.25;
      const osc3 = ctx.createOscillator();
      const osc4 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc3.type = 'sine';
      osc4.type = 'sine';
      osc3.frequency.setValueAtTime(580, now2);
      osc4.frequency.setValueAtTime(740, now2);

      gain2.gain.setValueAtTime(0.01, now2);
      gain2.gain.exponentialRampToValueAtTime(0.35, now2 + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 1.2);

      osc3.connect(gain2);
      osc4.connect(gain2);
      gain2.connect(ctx.destination);

      osc3.start(now2);
      osc4.start(now2);
      osc3.stop(now2 + 1.2);
      osc4.stop(now2 + 1.2);
    };

    playTone();
    this.ringtoneInterval = setInterval(playTone, 2800);
  }

  stopIncomingRingtone(): void {
    this.isRinging = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Outgoing Ringing Dial Tone (Standard soothing ring pulse)
   */
  startOutgoingDialTone(): void {
    if (this.isDialing) return;
    this.isDialing = true;

    const playTone = () => {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.setValueAtTime(0.12, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.4);
      osc2.stop(now + 1.4);
    };

    playTone();
    this.dialtoneInterval = setInterval(playTone, 3200);
  }

  stopOutgoingDialTone(): void {
    this.isDialing = false;
    if (this.dialtoneInterval) {
      clearInterval(this.dialtoneInterval);
      this.dialtoneInterval = null;
    }
  }

  /**
   * Connected Tone
   */
  playConnectedChime(): void {
    this.stopIncomingRingtone();
    this.stopOutgoingDialTone();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Call Ended Tone
   */
  playCallEndedChime(): void {
    this.stopIncomingRingtone();
    this.stopOutgoingDialTone();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(440, now + 0.12); // A4
    osc.frequency.setValueAtTime(329.63, now + 0.24); // E4

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}

export const callSoundEffects = new CallSoundEffects();
