import { create } from "zustand";
import { SynthState, SynthActions } from "./types/synth";
import { createInitialState } from "./state/initialState";
import { createSynthActions } from "./actions/synthActions";

export const useSynthStore = create<SynthState & SynthActions>((set) => ({
  ...createInitialState(),
  ...createSynthActions(set),
}));
