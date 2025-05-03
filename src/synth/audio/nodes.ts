import { OscillatorSettings, NoiseType, NoiseGenerator } from "../types";
import { getRangeMultiplier } from "../utils/frequency";

export function createOscillator(
  context: AudioContext,
  settings: OscillatorSettings,
  baseFrequency: number
): OscillatorNode {
  const oscillator = context.createOscillator();
  oscillator.type = settings.type;
  const rangeMultiplier = getRangeMultiplier(settings.range);
  const frequencyOffset = Math.pow(2, settings.frequency / 12);
  const finalFrequency = baseFrequency * rangeMultiplier * frequencyOffset;
  oscillator.frequency.value = finalFrequency;
  oscillator.detune.value = settings.detune;
  return oscillator;
}

export function createNoiseGenerator(
  context: AudioContext,
  type: NoiseType
): NoiseGenerator {
  if (type === "white") {
    const bufferSize = 2 * context.sampleRate;
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = context.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    return {
      node: whiteNoise,
      start: () => whiteNoise.start(),
      stop: () => whiteNoise.stop(),
      type,
    };
  }

  const bufferSize = 4096;
  const node = new AudioWorkletNode(context, "pink-noise-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      bufferSize,
    },
  });

  return {
    node,
    start: () => {},
    stop: () => {},
    type,
  };
}

export function createGainNode(
  context: AudioContext,
  volume: number
): GainNode {
  const gainNode = context.createGain();
  gainNode.gain.value = volume;
  return gainNode;
}
