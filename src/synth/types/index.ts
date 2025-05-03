export type Note = string;
export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";
export type NoiseType = "white" | "pink";

export type NoteData = {
  oscillators: OscillatorNode[];
  oscillatorGains: GainNode[];
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  noiseNode?: AudioNode;
  noiseGain?: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  filterEnvelope: GainNode;
  filterModGain: GainNode;
};

export type NoteState = {
  isPlaying: boolean;
  isReleased: boolean;
  startTime: number;
  releaseTime: number | null;
};

export type WaveformType = "sine" | "triangle" | "sawtooth" | "square";
export type RangeType = "32" | "16" | "8" | "4" | "2";
export type OscillatorParam = "frequency" | "waveform" | "range";
export type OscillatorParamValue = number | WaveformType | RangeType;

export type OscillatorBankProps = {
  osc1: OscillatorSettings;
  osc2: OscillatorSettings;
  osc3: OscillatorSettings;
  onOsc1Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
  onOsc2Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
  onOsc3Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
};

export type OscillatorSettings = {
  frequency: number;
  waveform: WaveformType;
  range: RangeType;
};

export type NoiseGenerator = {
  node: AudioNode;
  start: () => void;
  stop: () => void;
  type: NoiseType;
};

export type SynthSettings = {
  tune: number;
  modMix: number;
  oscillators: OscillatorSettings[];
  noise: {
    type: NoiseType;
    volume: number;
  };
  filter: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
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
