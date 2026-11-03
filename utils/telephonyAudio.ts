// Web Audio API Synthesizer for In-Browser Softphone Telephony (Zero External Audio Files Needed)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// DTMF Frequency Map (Dual Tone Multi Frequency)
const DTMF_FREQS: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

let ringbackInterval: any = null;
let ringOscillators: OscillatorNode[] = [];

/**
 * Plays realistic telephone ringback tone (Dual 400Hz + 450Hz cadence)
 */
export function startRingbackTone() {
  stopRingbackTone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playBurst = () => {
    try {
      if (!ctx || ctx.state === "closed") return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(400, ctx.currentTime);
      osc2.frequency.setValueAtTime(450, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  playBurst();
  ringbackInterval = setInterval(playBurst, 2800);
}

/**
 * Stops telephone ringback tone immediately
 */
export function stopRingbackTone() {
  if (ringbackInterval) {
    clearInterval(ringbackInterval);
    ringbackInterval = null;
  }
}

/**
 * Plays DTMF touch-tone beep for a keypad digit
 */
export function playDTMFTone(digit: string) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const freqs = DTMF_FREQS[digit];
  if (!freqs) return;

  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.18);
  } catch {
    // Audio autoplay fallback
  }
}

/**
 * Plays soft call-connected chime
 */
export function playConnectedTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

/**
 * Plays hangup / disconnect 3-beep tone
 */
export function playDisconnectTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    [0, 0.14, 0.28].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(425, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    });
  } catch {}
}

