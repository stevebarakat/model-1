import { SynthState } from "../types/synth";

type GetState = () => SynthState & {
  exportCurrentPreset: () => Record<string, unknown>;
};

export function createPresetExporter(get: GetState) {
  return function exportCurrentPreset(): Record<string, unknown> {
    const state = get();

    return {
      octave: state.octave,
      modMix: state.mixer.modMix,
      modWheel: state.modWheel,
      glide: state.glide,
      oscillators: createOscillatorPresetData(state),
      noise: { ...state.noise },
      filter: createFilterPresetData(state),
      envelope: { ...state.modifiers.envelope },
      lfo: { ...state.modifiers.lfo },
      reverb: { ...state.effects.reverb },
      distortion: { ...state.effects.distortion },
      delay: { ...state.effects.delay },
      arpeggiator: createArpeggiatorPresetData(state),
    };
  };
}

function createOscillatorPresetData(state: SynthState) {
  return [
    createOscillatorData(state, 1),
    createOscillatorData(state, 2),
    createOscillatorData(state, 3),
  ];
}

function createOscillatorData(state: SynthState, id: 1 | 2 | 3) {
  const oscillator = state.oscillators[`osc${id}`];
  const volume = state.mixer[`osc${id}Volume`];

  return {
    waveform: oscillator.waveform,
    frequency: oscillator.frequency,
    range: oscillator.range,
    volume,
    detune: oscillator.detune,
    pan: oscillator.pan ?? 0,
  };
}

function createFilterPresetData(state: SynthState) {
  return {
    cutoff: state.modifiers.cutoff,
    resonance: state.modifiers.resonance,
    contourAmount: state.modifiers.contourAmount,
    type: state.modifiers.filterType,
  };
}

function createArpeggiatorPresetData(state: SynthState) {
  return {
    enabled: state.arpeggiator.enabled,
    mode: state.arpeggiator.mode,
    rate: state.arpeggiator.rate,
    steps: state.arpeggiator.steps,
  };
}
