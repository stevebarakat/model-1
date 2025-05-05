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
  | "updateModifiers"
  | "updateEffects"
> {
  return {
    activeKeys: new Set(),
    keyboardRef: { synth: null },
    pitchWheel: 50,
    modWheel: 50,
    tune: 0,
    modMix: 0,
    currentOctave: 4,
    glide: 0,
    oscillators: {
      osc1: { frequency: 0, waveform: "triangle", range: "4", detune: 0 },
      osc2: { frequency: 0, waveform: "triangle", range: "4", detune: 0 },
      osc3: { frequency: 0, waveform: "triangle", range: "4", detune: 0 },
    },
    mixer: {
      osc1Volume: 0.7,
      osc2Volume: 0.7,
      osc3Volume: 0.7,
      noiseVolume: 0,
      noiseType: "white",
      modMix: 0,
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
      reverb: { amount: 0 },
      distortion: { outputGain: 0 },
      delay: { amount: 0 },
    },
  };
}
