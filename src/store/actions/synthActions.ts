import { StateCreator } from "zustand";
import { SynthState, SynthActions } from "../types/synth";

export function createSynthActions(
  set: Parameters<StateCreator<SynthState & SynthActions>>[0]
): SynthActions {
  return {
    setActiveKeys: (keys) =>
      set((state: SynthState) => ({
        activeKeys: typeof keys === "function" ? keys(state.activeKeys) : keys,
      })),
    setKeyboardRef: (ref) => set({ keyboardRef: ref }),
    setPitchWheel: (value) => set({ pitchWheel: value }),
    setModWheel: (value) => set({ modWheel: value }),
    setTune: (value) => set({ tune: value }),
    setModMix: (value) => set({ modMix: value }),
    setCurrentOctave: (value) => set({ currentOctave: value }),
    setGlide: (value) => {
      console.log("Setting glide value in store:", value);
      set({ glide: value });
    },
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
