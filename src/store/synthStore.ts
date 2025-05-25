import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SynthState, SynthActions } from "./types/synth";
import { createInitialState } from "./state/initialState";
import { createSynthActions } from "./actions/synthActions";

export const useSynthStore = create<
  SynthState & SynthActions & { exportCurrentPreset: () => any }
>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      ...createSynthActions(set),
      exportCurrentPreset: () => {
        const state = get();
        return {
          octave: state.octave,
          modMix: state.mixer.modMix,
          modWheel: state.modWheel,
          glide: state.glide,
          oscillators: [
            {
              waveform: state.oscillators.osc1.waveform,
              frequency: state.oscillators.osc1.frequency,
              range: state.oscillators.osc1.range,
              volume: state.mixer.osc1Volume,
              detune: state.oscillators.osc1.detune,
              pan: state.oscillators.osc1.pan ?? 0,
            },
            {
              waveform: state.oscillators.osc2.waveform,
              frequency: state.oscillators.osc2.frequency,
              range: state.oscillators.osc2.range,
              volume: state.mixer.osc2Volume,
              detune: state.oscillators.osc2.detune,
              pan: state.oscillators.osc2.pan ?? 0,
            },
            {
              waveform: state.oscillators.osc3.waveform,
              frequency: state.oscillators.osc3.frequency,
              range: state.oscillators.osc3.range,
              volume: state.mixer.osc3Volume,
              detune: state.oscillators.osc3.detune,
              pan: state.oscillators.osc3.pan ?? 0,
            },
          ],
          noise: { ...state.noise },
          filter: {
            cutoff: state.modifiers.cutoff,
            resonance: state.modifiers.resonance,
            contourAmount: state.modifiers.contourAmount,
            type: state.modifiers.filterType,
          },
          envelope: { ...state.modifiers.envelope },
          lfo: { ...state.modifiers.lfo },
          reverb: { ...state.effects.reverb },
          distortion: { ...state.effects.distortion },
          delay: { ...state.effects.delay },
        };
      },
    }),
    {
      name: "synth-storage",
      partialize: (state) => ({
        modWheel: state.modWheel,
      }),
    }
  )
);
