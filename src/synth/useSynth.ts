import { useMachine } from "@xstate/react";
import { synthMachine } from "./synthMachine";
import type { StateFrom } from "xstate";

type SynthState = StateFrom<typeof synthMachine>;

export const useSynth = () => {
  const [state, send] = useMachine(synthMachine);

  const isActive = state.matches("active");
  const settings = state.context.settings;

  const init = () => send({ type: "INIT" });
  const dispose = () => send({ type: "DISPOSE" });
  const noteOn = (note: string) => send({ type: "NOTE_ON", note });
  const noteOff = (note: string) => send({ type: "NOTE_OFF", note });
  const updateSettings = (
    newSettings: Partial<SynthState["context"]["settings"]>
  ) => send({ type: "UPDATE_SETTINGS", settings: newSettings });

  return {
    isActive,
    settings,
    init,
    dispose,
    noteOn,
    noteOff,
    updateSettings,
  };
};
