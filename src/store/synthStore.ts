import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { SynthState, SynthActions } from "./types/synth";
import { createInitialState } from "./state/initialState";
import { createSynthActions } from "./actions/synthActions";
import { createPresetExporter } from "./utils/presetExporter";
import { createCustomHooks } from "./hooks";

export type Store = SynthState &
  SynthActions & { exportCurrentPreset: () => Record<string, unknown> };

export const useSynthStore = create<Store>()((set, get) => ({
  ...createInitialState(),
  ...createSynthActions(set),
  exportCurrentPreset: createPresetExporter(get),
}));

// Optimized selectors for better performance
export const useSynthSelectors = {
  // Keyboard state selectors
  useActiveKeys: () => useSynthStore((state) => state.activeKeys),
  useKeyboardRef: () => useSynthStore((state) => state.keyboardRef),

  // Controller state selectors
  usePitchWheel: () => useSynthStore((state) => state.pitchWheel),
  useModWheel: () => useSynthStore((state) => state.modWheel),
  useOctave: () => useSynthStore((state) => state.octave),
  useModMix: () => useSynthStore((state) => state.mixer.modMix),
  useCurrentOctave: () => useSynthStore((state) => state.currentOctave),
  useGlide: () => useSynthStore((state) => state.glide),

  // Arpeggiator state selector
  useArpeggiator: () => useSynthStore((state) => state.arpeggiator),

  // Oscillator state selectors
  useOscillators: () => useSynthStore((state) => state.oscillators, shallow),
  useOscillator: (id: 1 | 2 | 3) =>
    useSynthStore((state) => state.oscillators[`osc${id}`]),

  // Mixer state selector
  useMixer: () => useSynthStore((state) => state.mixer, shallow),

  // Noise state selector
  useNoise: () => useSynthStore((state) => state.noise, shallow),

  // Modifier state selectors
  useModifiers: () => useSynthStore((state) => state.modifiers, shallow),
  useFilter: () =>
    useSynthStore(
      (state) => ({
        cutoff: state.modifiers.cutoff,
        resonance: state.modifiers.resonance,
        contourAmount: state.modifiers.contourAmount,
        filterType: state.modifiers.filterType,
      }),
      shallow
    ),
  useEnvelope: () =>
    useSynthStore((state) => state.modifiers.envelope, shallow),
  useLFO: () => useSynthStore((state) => state.modifiers.lfo, shallow),

  // Effects state selectors
  useEffects: () => useSynthStore((state) => state.effects, shallow),
  useReverb: () => useSynthStore((state) => state.effects.reverb, shallow),
  useDelay: () => useSynthStore((state) => state.effects.delay, shallow),
  useDistortion: () =>
    useSynthStore((state) => state.effects.distortion, shallow),

  // Individual action selectors to prevent infinite loops
  useSetActiveKeys: () => useSynthStore((state) => state.setActiveKeys),
  useSetKeyboardRef: () => useSynthStore((state) => state.setKeyboardRef),
  useSetPitchWheel: () => useSynthStore((state) => state.setPitchWheel),
  useSetModWheel: () => useSynthStore((state) => state.setModWheel),
  useSetOctave: () => useSynthStore((state) => state.setOctave),
  useSetCurrentOctave: () => useSynthStore((state) => state.setCurrentOctave),
  useSetGlide: () => useSynthStore((state) => state.setGlide),
  useUpdateOscillator: () => useSynthStore((state) => state.updateOscillator),
  useSetOscillator: () => useSynthStore((state) => state.setOscillator),
  useUpdateMixer: () => useSynthStore((state) => state.updateMixer),
  useUpdateNoise: () => useSynthStore((state) => state.updateNoise),
  useUpdateModifiers: () => useSynthStore((state) => state.updateModifiers),
  useUpdateEffects: () => useSynthStore((state) => state.updateEffects),
  useUpdateArpeggiator: () => useSynthStore((state) => state.updateArpeggiator),
};

export const { useOscillator, useEffect, useModifier } =
  createCustomHooks(useSynthSelectors);
