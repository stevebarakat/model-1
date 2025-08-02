import { SynthState, SynthActions } from "../types/synth";

export function createSynthActions(
  set: (
    partial:
      | SynthState
      | Partial<SynthState>
      | ((state: SynthState) => Partial<SynthState>),
    replace?: boolean
  ) => void
): SynthActions {
  return {
    setActiveKeys: (key) =>
      set((state: SynthState) => ({
        activeKeys: typeof key === "function" ? key(state.activeKeys) : key,
      })),
    setKeyboardRef: (ref) => set({ keyboardRef: ref }),
    setPitchWheel: (value) => set({ pitchWheel: value }),
    setModWheel: (value) =>
      set((state) => ({
        modWheel: value,
        mixer: { ...state.mixer, modMix: value },
      })),
    setOctave: (value) => set({ octave: value }),
    setCurrentOctave: (value) => set({ currentOctave: value }),
    setGlide: (value) => set({ glide: value }),
    updateOscillator: (id, settings) =>
      set((state: SynthState) => ({
        oscillators: {
          ...state.oscillators,
          [`osc${id}`]: { ...state.oscillators[`osc${id}`], ...settings },
        },
      })),
    setOscillator: (id, settings) =>
      set((state: SynthState) => ({
        oscillators: {
          ...state.oscillators,
          [`osc${id}`]: settings,
        },
      })),
    updateMixer: (settings) =>
      set((state: SynthState) => ({
        mixer: { ...state.mixer, ...settings },
      })),
    updateNoise: (settings) =>
      set((state: SynthState) => ({
        noise: { ...state.noise, ...settings },
      })),
    updateModifiers: (settings) =>
      set((state: SynthState) => ({
        modifiers: { ...state.modifiers, ...settings },
      })),
    updateEffects: (settings) =>
      set((state: SynthState) => ({
        effects: { ...state.effects, ...settings },
      })),
    updateArpeggiator: (settings) =>
      set((state) => ({
        arpeggiator: {
          ...state.arpeggiator,
          ...settings,
        },
      })),
  };
}
