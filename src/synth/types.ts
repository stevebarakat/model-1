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
  noiseNode: AudioWorkletNode | null;
  noiseGain: GainNode | null;
  noisePanner: StereoPannerNode | null;
  noiseFilter: BiquadFilterNode | null;
};

export type OscillatorSettings = {
  type: OscillatorType;
  range: RangeType;
  frequency: number;
  detune: number;
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
