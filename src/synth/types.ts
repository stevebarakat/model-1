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
