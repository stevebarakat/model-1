import { StateCreator } from "zustand";
import { SynthState, SynthActions } from "../types/synth";

export function createSynthActions(
  set: Parameters<StateCreator<SynthState & SynthActions>>[0]
): SynthActions {
  return {
    setActiveKeys: (key) =>
      set((state: SynthState) => ({
        activeKeys: typeof key === "function" ? key(state.activeKeys) : key,
      })),
    setKeyboardRef: (ref) => set({ keyboardRef: ref }),
    setPitchWheel: (value) => set({ pitchWheel: value }),
    setModWheel: (value) => set({ modWheel: value }),
    setOctave: (value) => set({ octave: value }),
    setModMix: (value) => set({ modMix: value }),
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
  };
}
