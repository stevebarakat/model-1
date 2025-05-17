import { OscillatorSettings, FilterType } from "@/synth/types";

export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";
export type Note = string;

export type SynthState = {
  // Keyboard state
  activeKeys: Note | null;
  keyboardRef: {
    synth: Awaited<
      ReturnType<typeof import("@/synth/WebAudioSynth").createSynth>
    > | null;
  };

  // Controller state
  pitchWheel: number;
  modWheel: number;
  tune: number;
  modMix: number;
  currentOctave: number;
  glide: number;

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
    modMix: number;
  };

  // Noise state
  noise: {
    volume: number;
    pan: number;
    type: "white" | "pink";
    tone: number;
    sync: boolean;
  };

  // Modifier state
  modifiers: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
    filterType: FilterType;
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
      routing: {
        filterCutoff: boolean;
        filterResonance: boolean;
        oscillatorPitch: boolean;
        oscillatorVolume: boolean;
      };
    };
  };

  // Effects state
  effects: {
    reverb: { amount: number; decay: number; eq: number };
    distortion: {
      outputGain: number;
      lowEQ: number;
      highEQ: number;
    };
    delay: { amount: number; time: number; feedback: number };
  };
};

export type SynthActions = {
  setActiveKeys: (
    key: Note | null | ((prev: Note | null) => Note | null)
  ) => void;
  setKeyboardRef: (ref: {
    synth: Awaited<
      ReturnType<typeof import("@/synth/WebAudioSynth").createSynth>
    > | null;
  }) => void;
  setPitchWheel: (value: number) => void;
  setModWheel: (value: number) => void;
  setTune: (value: number) => void;
  setModMix: (value: number) => void;
  setCurrentOctave: (value: number) => void;
  setGlide: (value: number) => void;
  updateOscillator: (
    id: 1 | 2 | 3,
    settings: Partial<OscillatorSettings>
  ) => void;
  setOscillator: (id: 1 | 2 | 3, settings: OscillatorSettings) => void;
  updateMixer: (settings: Partial<SynthState["mixer"]>) => void;
  updateNoise: (settings: Partial<SynthState["noise"]>) => void;
  updateModifiers: (settings: Partial<SynthState["modifiers"]>) => void;
  updateEffects: (settings: Partial<SynthState["effects"]>) => void;
};
