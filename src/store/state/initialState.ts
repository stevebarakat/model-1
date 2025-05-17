import { SynthState } from "../types/synth";

export function createInitialState(): Omit<
  SynthState,
  | "setActiveKeys"
  | "setKeyboardRef"
  | "setPitchWheel"
  | "setModWheel"
  | "setTune"
  | "setModMix"
  | "setCurrentOctave"
  | "setGlide"
  | "updateOscillator"
  | "setOscillator"
  | "updateMixer"
  | "updateNoise"
  | "updateModifiers"
  | "updateEffects"
> {
  return {
    activeKeys: new Set(),
    keyboardRef: { synth: null },
    pitchWheel: 50,
    modWheel: 50,
    tune: 0,
    modMix: 50,
    currentOctave: 4,
    glide: 0,
    oscillators: {
      osc1: {
        frequency: 0,
        waveform: "triangle",
        range: "4",
        detune: 0,
        volume: 0.7,
      },
      osc2: {
        frequency: 0,
        waveform: "triangle",
        range: "4",
        detune: 0,
        volume: 0.7,
      },
      osc3: {
        frequency: 0,
        waveform: "triangle",
        range: "4",
        detune: 0,
        volume: 0.7,
      },
    },
    mixer: {
      osc1Volume: 0.7,
      osc2Volume: 0.7,
      osc3Volume: 0.7,
      modMix: 50,
    },
    noise: {
      volume: 0,
      pan: 0,
      type: "white",
      tone: 440,
      sync: false,
    },
    modifiers: {
      cutoff: 2000,
      resonance: 0,
      contourAmount: 0,
      filterType: "lowpass",
      envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      },
      lfo: {
        rate: 5,
        depth: 0.5,
        waveform: "sine",
        routing: {
          filterCutoff: true,
          filterResonance: false,
          oscillatorPitch: false,
          oscillatorVolume: false,
        },
      },
    },
    effects: {
      reverb: { amount: 0, decay: 1.5, eq: 50 },
      distortion: { outputGain: 0 },
      delay: { amount: 0, time: 0.3, feedback: 13 },
    },
  };
}
