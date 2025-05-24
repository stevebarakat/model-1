import { OscillatorSettings } from "../types";
import { getRangeMultiplier } from "../utils/frequency";

export function createOscillator(
  context: AudioContext,
  settings: OscillatorSettings,
  baseFrequency: number
): OscillatorNode {
  const oscillator = context.createOscillator();
  oscillator.type = settings.type || "sine";
  const rangeMultiplier = getRangeMultiplier(settings.range);
  const frequencyOffset = Math.pow(2, settings.frequency / 12);
  const finalFrequency = baseFrequency * rangeMultiplier * frequencyOffset;
  oscillator.frequency.value = finalFrequency;
  oscillator.detune.value = settings.detune;
  return oscillator;
}

export function createGainNode(
  context: AudioContext,
  volume: number
): GainNode {
  const gainNode = context.createGain();
  gainNode.gain.value = volume;
  return gainNode;
}
