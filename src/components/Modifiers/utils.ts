import { WaveformType, FilterType, LFORouting } from "@/synth/types/index";
import { WAVEFORMS, FILTER_TYPES } from "./constants.tsx";

export function waveformToValue(waveform: WaveformType): number {
  return WAVEFORMS.indexOf(waveform);
}

export function valueToWaveform(value: number): WaveformType {
  const index = Math.round(value);
  return WAVEFORMS[Math.max(0, Math.min(WAVEFORMS.length - 1, index))];
}

export function routingToValue(routing: LFORouting): number {
  let value = 0;
  if (routing.filterCutoff) value += 1;
  if (routing.filterResonance) value += 2;
  if (routing.oscillatorPitch) value += 4;
  if (routing.oscillatorVolume) value += 8;
  return value;
}

export function valueToRouting(value: number): LFORouting {
  return {
    filterCutoff: (value & 1) !== 0,
    filterResonance: (value & 2) !== 0,
    oscillatorPitch: (value & 4) !== 0,
    oscillatorVolume: (value & 8) !== 0,
  };
}

export function filterTypeToValue(type: FilterType): number {
  return FILTER_TYPES.indexOf(type);
}

export function valueToFilterType(value: number): FilterType {
  const index = Math.round(value);
  return FILTER_TYPES[Math.max(0, Math.min(FILTER_TYPES.length - 1, index))];
}
