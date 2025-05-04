export type Note = string;
export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";
export type NoiseType = "white" | "pink";
export type RangeType = "32" | "16" | "8" | "4" | "2";
export type FilterType = BiquadFilterType;
export type NoteData = {
  oscillators: OscillatorNode[];
  oscillatorGains: GainNode[];
  oscillatorPanners: StereoPannerNode[];
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  noiseNode?: AudioNode;
  noiseGain?: GainNode;
  lfo: OscillatorNode;
  lfoGains: {
    filterCutoff: GainNode;
    filterResonance: GainNode;
    oscillatorPitch: GainNode;
    oscillatorVolume: GainNode;
  };
  filterEnvelope: GainNode;
  filterModGain: GainNode;
};

export type NoteState = {
  isPlaying: boolean;
  isReleased: boolean;
  startTime: number;
  releaseTime: number | null;
};

export type OscillatorSettings = {
  waveform: OscillatorType;
  frequency: number;
  range: RangeType;
  detune: number;
  volume?: number;
  type?: OscillatorType;
  pan?: number; // -1 (left) to 1 (right)
};

export type NoiseGenerator = {
  node: AudioNode;
  start: () => void;
  stop: () => void;
  type: NoiseType;
};

export type LFORouting = {
  filterCutoff: boolean;
  filterResonance: boolean;
  oscillatorPitch: boolean;
  oscillatorVolume: boolean;
};

export type SynthSettings = {
  tune: number;
  modMix: number;
  modWheel: number;
  glide: number;
  oscillators: OscillatorSettings[];
  noise: {
    type: NoiseType;
    volume: number;
  };
  filter: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
    type: FilterType;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  lfo: {
    rate: number;
    depth: number;
    waveform: WaveformType;
    routing: LFORouting;
  };
  reverb: {
    amount: number;
  };
  distortion: {
    outputGain: number;
  };
  delay: {
    amount: number;
  };
};

export type WaveformType = "triangle" | "sawtooth" | "square" | "sine";

export type OscillatorBankProps = {
  osc1: OscillatorSettings;
  osc2: OscillatorSettings;
  osc3: OscillatorSettings;
  onOsc1Change: (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => void;
  onOsc2Change: (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => void;
  onOsc3Change: (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => void;
};

export type FilterSettings = {
  type: FilterType;
  cutoff: number;
  resonance: number;
  envelopeAmount: number;
};
