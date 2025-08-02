import { OscillatorSettings } from "@/synth/types";

type Selectors = typeof import("./synthStore").useSynthSelectors;

export function createCustomHooks(useSynthSelectors: Selectors) {
  return {
    useOscillator: createOscillatorHook(useSynthSelectors),
    useEffect: createEffectHook(useSynthSelectors),
    useModifier: createModifierHook(useSynthSelectors),
  };
}

function createOscillatorHook(useSynthSelectors: Selectors) {
  return function useOscillator(id: 1 | 2 | 3) {
    const oscillator = useSynthSelectors.useOscillator(id);
    const mixer = useSynthSelectors.useMixer();
    const setOscillator = useSynthSelectors.useSetOscillator();

    const volume = mixer[`osc${id}Volume` as keyof typeof mixer] as number;

    return {
      oscillator,
      volume,
      setOscillator: (settings: Partial<OscillatorSettings>) =>
        setOscillator(id, settings),
    };
  };
}

function createEffectHook(useSynthSelectors: Selectors) {
  return function useEffect(effectName: "reverb" | "delay" | "distortion") {
    const effect =
      useSynthSelectors[
        `use${
          effectName.charAt(0).toUpperCase() + effectName.slice(1)
        }` as keyof typeof useSynthSelectors
      ]();
    const updateEffects = useSynthSelectors.useUpdateEffects();

    return {
      effect,
      updateEffect: (settings: Record<string, unknown>) =>
        updateEffects({ [effectName]: settings }),
    };
  };
}

function createModifierHook(useSynthSelectors: Selectors) {
  return function useModifier(modifierName: "filter" | "envelope" | "lfo") {
    const modifier =
      useSynthSelectors[
        `use${
          modifierName.charAt(0).toUpperCase() + modifierName.slice(1)
        }` as keyof typeof useSynthSelectors
      ]();
    const updateModifiers = useSynthSelectors.useUpdateModifiers();

    return {
      modifier,
      updateModifier: (settings: Record<string, unknown>) =>
        updateModifiers({ [modifierName]: settings }),
    };
  };
}
