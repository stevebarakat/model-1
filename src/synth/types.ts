export type Note = string;

export type NoteState = {
  isPlaying: boolean;
  isReleased: boolean;
  startTime: number;
  releaseTime: number | null;
};

export type SynthSettings = {
  tune: number;
  modMix: number;
  modWheel: number;
  glide: number;
  oscillators: Array<{
    waveform: OscillatorType;
    frequency: number;
    range: RangeType;
    volume: number;
    detune: number;
    pan?: number;
  }>;
  noise: {
    volume: number;
    pan: number;
    type: "white" | "pink";
    tone: number;
    sync: boolean;
  };
  filter: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
    type: "lowpass" | "highpass" | "bandpass" | "notch";
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
    waveform: OscillatorType;
    routing: {
      filterCutoff: boolean;
      filterResonance: boolean;
      oscillatorPitch: boolean;
      oscillatorVolume: boolean;
    };
  };
  reverb: {
    amount: number;
    decay: number;
  };
  distortion: {
    outputGain: number;
  };
  delay: {
    amount: number;
  };
};

export type NoteData = {
  oscillators: OscillatorNode[];
  oscillatorGains: GainNode[];
  oscillatorPanners: StereoPannerNode[];
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGains: {
    filterCutoff: GainNode;
    filterResonance: GainNode;
    oscillatorPitch: GainNode;
    oscillatorVolume: GainNode;
  };
  filterEnvelope: GainNode;
  filterModGain: GainNode;
  noiseNode: AudioWorkletNode | null;
  noiseGain: GainNode | null;
  noisePanner: StereoPannerNode | null;
  noiseFilter: BiquadFilterNode | null;
};

export type OscillatorSettings = {
  waveform: OscillatorType;
  frequency: number;
  range: RangeType;
  volume: number;
  detune: number;
  pan?: number;
};

export type RangeType = "32" | "16" | "8" | "4" | "2";
export type OscillatorType = "triangle" | "sawtooth" | "square" | "sine";

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
