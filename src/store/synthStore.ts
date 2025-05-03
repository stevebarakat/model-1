import { create } from "zustand";
import { Note, OscillatorType, RangeType, WaveformType } from "../synth/types";

type RangeType = "32" | "16" | "8" | "4" | "2";
type Note = string;

interface OscillatorSettings {
  frequency: number;
  waveform: OscillatorType;
  range: RangeType;
}

interface SynthState {
  // Keyboard state
  activeKeys: Set<Note>;
  keyboardRef: {
    synth: Awaited<
      ReturnType<typeof import("../synth/WebAudioSynth").createSynth>
    > | null;
  };

  // Controller state
  pitchWheel: number;
  modWheel: number;
  tune: number;
  modMix: number;

  // Oscillator state
  oscillators: {
    osc1: OscillatorSettings;
    osc2: OscillatorSettings;
    osc3: OscillatorSettings;
  };

  // Mixer state
  mixer: {
    osc1Volume: number;
    osc2Volume: number;
    osc3Volume: number;
    noiseVolume: number;
    noiseType: "white" | "pink";
  };

  // Modifier state
  modifiers: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
    lfo: {
      rate: number;
      depth: number;
      waveform: OscillatorType;
    };
  };

  // Effects state
  effects: {
    reverb: { amount: number };
    distortion: { outputGain: number };
    delay: { amount: number };
  };

  // Actions
  setActiveKeys: (keys: Set<Note>) => void;
  setKeyboardRef: (ref: {
    synth: Awaited<
      ReturnType<typeof import("../synth/WebAudioSynth").createSynth>
    > | null;
  }) => void;
  setPitchWheel: (value: number) => void;
  setModWheel: (value: number) => void;
  setTune: (value: number) => void;
  setModMix: (value: number) => void;
  updateOscillator: (
    id: 1 | 2 | 3,
    settings: Partial<OscillatorSettings>
  ) => void;
  updateMixer: (settings: Partial<SynthState["mixer"]>) => void;
  updateModifiers: (settings: Partial<SynthState["modifiers"]>) => void;
  updateEffects: (settings: Partial<SynthState["effects"]>) => void;
}

const initialState: Omit<
  SynthState,
  | "setActiveKeys"
  | "setKeyboardRef"
  | "setPitchWheel"
  | "setModWheel"
  | "setTune"
  | "setModMix"
  | "updateOscillator"
  | "updateMixer"
  | "updateModifiers"
  | "updateEffects"
> = {
  activeKeys: new Set(),
  keyboardRef: { synth: null },
  pitchWheel: 50,
  modWheel: 0,
  tune: 0,
  modMix: 0,
  oscillators: {
    osc1: { frequency: 0, waveform: "triangle", range: "8" },
    osc2: { frequency: 0, waveform: "triangle", range: "8" },
    osc3: { frequency: 0, waveform: "triangle", range: "8" },
  },
  mixer: {
    osc1Volume: 0.7,
    osc2Volume: 0.7,
    osc3Volume: 0.7,
    noiseVolume: 0,
    noiseType: "white",
  },
  modifiers: {
    cutoff: 2000,
    resonance: 0,
    contourAmount: 0,
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
    },
  },
  effects: {
    reverb: { amount: 0 },
    distortion: { outputGain: 0 },
    delay: { amount: 0 },
  },
};

export const useSynthStore = create<SynthState>((set) => ({
  ...initialState,
  setActiveKeys: (keys: Set<Note>) => set({ activeKeys: keys }),
  setKeyboardRef: (ref: {
    synth: Awaited<
      ReturnType<typeof import("../synth/WebAudioSynth").createSynth>
    > | null;
  }) => set({ keyboardRef: ref }),
  setPitchWheel: (value: number) => set({ pitchWheel: value }),
  setModWheel: (value: number) => set({ modWheel: value }),
  setTune: (value: number) => set({ tune: value }),
  setModMix: (value: number) => set({ modMix: value }),
  updateOscillator: (id: 1 | 2 | 3, settings: Partial<OscillatorSettings>) =>
    set((state: SynthState) => ({
      oscillators: {
        ...state.oscillators,
        [`osc${id}`]: { ...state.oscillators[`osc${id}`], ...settings },
      },
    })),
  updateMixer: (settings: Partial<SynthState["mixer"]>) =>
    set((state: SynthState) => ({
      mixer: { ...state.mixer, ...settings },
    })),
  updateModifiers: (settings: Partial<SynthState["modifiers"]>) =>
    set((state: SynthState) => ({
      modifiers: { ...state.modifiers, ...settings },
    })),
  updateEffects: (settings: Partial<SynthState["effects"]>) =>
    set((state: SynthState) => ({
      effects: { ...state.effects, ...settings },
    })),
}));
