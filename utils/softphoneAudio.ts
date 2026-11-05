// Web Audio API Synthesizer for Realistic Telecom Softphone Experience
// Generates authentic Indian ringback cadence, DTMF key tones, and disconnect chime

let audioCtx: AudioContext | null = null;
let activeRingbackGain: GainNode | null = null;
let ringbackIntervalId: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// DTMF Frequencies (Hz)
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

/**
 * Play authentic DTMF tone on dialpad key tap
 */
export function playDtmfTone(key: string, durationMs = 120) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freqs = DTMF_FREQS[key] || [700, 1200];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + durationMs / 1000);
    osc2.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    console.debug("[Audio] DTMF error:", e);
  }
}

/**
 * Play standard Indian Telecom Ringback Cadence
 * Indian standard: 400Hz + 450Hz, 0.4s ON, 0.2s OFF, 0.4s ON, 2.0s OFF
 */
export function startIndianRingbackCadence(): () => void {
  stopRingbackCadence();

  try {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    const playBurst = () => {
      try {
        if (!ctx || ctx.state === "closed") return;
        const now = ctx.currentTime;

        // Dual oscillators 400Hz and 450Hz
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.value = 400;
        osc2.frequency.value = 450;

        // Cadence envelope:
        // Burst 1: 0.0s to 0.4s (ON)
        // Silence: 0.4s to 0.6s (OFF)
        // Burst 2: 0.6s to 1.0s (ON)
        // Long silence: 1.0s to 3.0s (OFF)
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.03);
        gain.gain.setValueAtTime(0.09, now + 0.38);
        gain.gain.linearRampToValueAtTime(0, now + 0.42);

        gain.gain.setValueAtTime(0, now + 0.6);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.63);
        gain.gain.setValueAtTime(0.09, now + 0.98);
        gain.gain.linearRampToValueAtTime(0, now + 1.02);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        activeRingbackGain = gain;

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.05);
        osc2.stop(now + 1.05);
      } catch (err) {
        console.debug("[Audio] Ringback burst error:", err);
      }
    };

    // Immediate first burst
    playBurst();

    // Repeat every 3 seconds (standard cadence cycle)
    ringbackIntervalId = setInterval(playBurst, 3000);
  } catch (e) {
    console.debug("[Audio] Ringback start error:", e);
  }

  return stopRingbackCadence;
}

export function stopRingbackCadence() {
  if (ringbackIntervalId) {
    clearInterval(ringbackIntervalId);
    ringbackIntervalId = null;
  }
  if (activeRingbackGain && audioCtx) {
    try {
      activeRingbackGain.gain.setValueAtTime(0, audioCtx.currentTime);
      activeRingbackGain.disconnect();
    } catch {}
    activeRingbackGain = null;
  }
}

/**
 * Play authentic Disconnect / Call Ended Chime (2 quick descending beeps)
 */
export function playCallEndTone() {
  stopRingbackCadence();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.setValueAtTime(420, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.debug("[Audio] Call end chime error:", e);
  }
}

