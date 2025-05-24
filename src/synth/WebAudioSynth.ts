import {
  Note,
  NoteData,
  NoteState,
  SynthSettings,
  OscillatorType,
  RangeType,
} from "./types";
import { noteToFrequency, getRangeMultiplier } from "./utils/frequency";
import { createOscillator, createGainNode } from "./audio/nodes";
import { setupEffects } from "./audio/effects";

type SynthContext = {
  context: AudioContext;
  masterGain: GainNode;
  delayGain: GainNode;
  delayNode: DelayNode;
  delayFeedback: GainNode;
  reverbGain: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  noiseNode: AudioWorkletNode | null;
  noiseGain: GainNode;
  noisePanner: StereoPannerNode;
  reverbNode: ConvolverNode;
  reverbEQ: BiquadFilterNode;
  createImpulseResponse: (decay: number) => AudioBuffer;
  distortionLowEQ: BiquadFilterNode;
  distortionHighEQ: BiquadFilterNode;
  distortion: AudioNode & {
    drive: number;
    outputGain: number;
    curveAmount: number;
    algorithmIndex: number;
    bypass: number;
  };
  compressor: DynamicsCompressorNode;
};

type SynthState = {
  currentNote: Note | null;
  noteState: NoteState | null;
  noteData: NoteData | null;
  settings: SynthSettings;
  activeNotes: Map<Note, NoteData>;
  noteStates: Map<Note, NoteState>;
  lastPlayedFrequency: number | null;
};

type LFORouting = {
  filterCutoff: boolean;
  filterResonance: boolean;
  oscillatorPitch: boolean;
  oscillatorVolume: boolean;
};

type LFOConnection = {
  source: GainNode;
  target: AudioParam;
  enabled: boolean;
};

type OscillatorSettings = {
  waveform: OscillatorType;
  frequency: number;
  range: RangeType;
  detune: number;
  volume?: number;
  type?: OscillatorType;
  pan?: number;
  enabled?: boolean;
};

type NoiseSettings = {
  volume: number;
  pan: number;
  type: "white" | "pink";
  tone: number;
  sync: boolean;
};

type OscillatorChain = {
  oscillator: OscillatorNode | null;
  gain: GainNode | null;
  panner: StereoPannerNode | null;
};

function createSynthContext(context: AudioContext): SynthContext {
  // Use setupEffects to create the effects chain
  const effects = setupEffects(context);

  // Create noise-related nodes
  const noiseGain = context.createGain();
  const noisePanner = context.createStereoPanner();

  // Start the audio context if it's not already running
  if (context.state === "suspended") {
    context.resume();
  }

  return {
    context,
    masterGain: effects.masterGain,
    delayGain: effects.delayGain,
    delayNode: effects.delayNode,
    delayFeedback: effects.delayFeedback,
    reverbGain: effects.reverbGain,
    dryGain: effects.dryGain,
    wetGain: effects.wetGain,
    noiseNode: null,
    noiseGain,
    noisePanner,
    reverbNode: effects.reverbNode,
    reverbEQ: effects.reverbEQ,
    createImpulseResponse: effects.createImpulseResponse,
    distortionLowEQ: effects.distortionLowEQ,
    distortionHighEQ: effects.distortionHighEQ,
    distortion: effects.distortion,
    compressor: effects.compressor,
  };
}

function createInitialState(): SynthState {
  return {
    currentNote: null,
    noteState: null,
    noteData: null,
    settings: {
      octave: 0,
      modMix: 0,
      modWheel: 50,
      glide: 0,
      oscillators: [
        {
          waveform: "triangle",
          frequency: 0,
          range: "8",
          volume: 0.7,
          detune: 0,
        },
        {
          waveform: "triangle",
          frequency: 0,
          range: "8",
          volume: 0.7,
          detune: 0,
        },
        {
          waveform: "triangle",
          frequency: 0,
          range: "8",
          volume: 0.7,
          detune: 0,
        },
      ],
      noise: {
        volume: 0,
        pan: 0,
        type: "white",
        tone: 440,
        sync: false,
      },
      filter: {
        cutoff: 2000,
        resonance: 0,
        contourAmount: 0,
        type: "lowpass" as const,
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.5,
      },
      lfo: {
        rate: 0,
        depth: 0,
        waveform: "sine",
        routing: {
          filterCutoff: true,
          filterResonance: false,
          oscillatorPitch: false,
          oscillatorVolume: false,
        },
      },
      reverb: {
        amount: 0,
        decay: 0.5,
        eq: 0,
      },
      distortion: {
        outputGain: 0,
        lowEQ: 50,
        highEQ: 50,
      },
      delay: {
        amount: 0,
        time: 0.3,
        feedback: 0.3,
      },
    },
    activeNotes: new Map(),
    noteStates: new Map(),
    lastPlayedFrequency: null,
  };
}

function createLFOConnections(
  noteData: NoteData,
  routing: LFORouting
): LFOConnection[] {
  if (!noteData.lfoGains || !noteData.filterNode) {
    return [];
  }

  return [
    {
      source: noteData.lfoGains.filterCutoff,
      target: noteData.filterNode.frequency,
      enabled: routing.filterCutoff,
    },
    {
      source: noteData.lfoGains.filterResonance,
      target: noteData.filterNode.Q,
      enabled: routing.filterResonance,
    },
    {
      source: noteData.lfoGains.oscillatorPitch,
      target: noteData.oscillators[0]?.detune,
      enabled: routing.oscillatorPitch,
    },
    {
      source: noteData.lfoGains.oscillatorVolume,
      target: noteData.oscillatorGains[0]?.gain,
      enabled: routing.oscillatorVolume,
    },
  ];
}

function reconnectLFO(noteData: NoteData, routing: LFORouting): void {
  if (!noteData.lfoGains) {
    return;
  }

  // First disconnect all connections
  const gains = Object.values(noteData.lfoGains);
  gains.forEach((gain) => {
    gain.disconnect();
  });

  // Then connect enabled ones in a single pass
  const connections = createLFOConnections(noteData, routing);
  connections
    .filter(({ enabled, target }) => enabled && target)
    .forEach(({ source, target }) => {
      try {
        source.connect(target);
      } catch (e) {
        console.warn("Error connecting LFO:", e);
      }
    });
}

function createOscillatorChain(
  context: AudioContext,
  oscSettings: OscillatorSettings,
  baseFrequency: number,
  startTime: number,
  lastFrequency: number | null,
  glide: number
): {
  oscillator: OscillatorNode | null;
  gain: GainNode | null;
  panner: StereoPannerNode | null;
} {
  // If oscillator is disabled, return null chain
  if (oscSettings.enabled === false) {
    return {
      oscillator: null,
      gain: null,
      panner: null,
    };
  }

  try {
    // Use Float32Array for frequency calculations
    const freqCalc = new Float32Array(3);
    freqCalc[0] = getRangeMultiplier(oscSettings.range);
    freqCalc[1] = Math.pow(2, oscSettings.frequency / 12);
    freqCalc[2] = baseFrequency;

    const finalFrequency = freqCalc[0] * freqCalc[1] * freqCalc[2];

    // Only use lastFrequency for glide if it's valid and glide is enabled
    const startFrequency =
      glide > 0 && lastFrequency
        ? lastFrequency * freqCalc[0] * freqCalc[1]
        : finalFrequency;

    // Create nodes with optimized settings
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const panNode = context.createStereoPanner();

    // Set oscillator properties
    oscillator.type = (oscSettings.waveform ?? "sine") as OscillatorType;
    oscillator.frequency.value = startFrequency;
    oscillator.detune.value = oscSettings.detune ?? 0;
    panNode.pan.value = oscSettings.pan ?? 0;

    // Connect nodes with error handling
    try {
      oscillator.connect(gainNode);
      gainNode.connect(panNode);
    } catch (e) {
      console.warn("Error connecting oscillator chain nodes:", e);
      // Cleanup on connection error
      oscillator.disconnect();
      gainNode.disconnect();
      panNode.disconnect();
      return {
        oscillator: null,
        gain: null,
        panner: null,
      };
    }

    // Start oscillator with error handling
    try {
      oscillator.start(startTime);
    } catch (e) {
      console.warn("Error starting oscillator:", e);
      // Cleanup on start error
      oscillator.disconnect();
      gainNode.disconnect();
      panNode.disconnect();
      return {
        oscillator: null,
        gain: null,
        panner: null,
      };
    }

    // Only apply glide if it's enabled
    if (glide > 0 && lastFrequency) {
      // Convert glide value (0-10) to time in seconds using logarithmic scale
      const glideTime = Math.pow(10, glide / 5) * 0.02;
      const currentTime = context.currentTime;

      // Ensure we're not scheduling in the past
      const scheduleTime = Math.max(currentTime, startTime);

      // Cancel any existing scheduled changes
      oscillator.frequency.cancelScheduledValues(scheduleTime);

      // Set the current value
      oscillator.frequency.setValueAtTime(startFrequency, scheduleTime);

      // Schedule the glide
      oscillator.frequency.linearRampToValueAtTime(
        finalFrequency,
        scheduleTime + glideTime
      );
    } else {
      // If glide is disabled, set frequency immediately
      oscillator.frequency.value = finalFrequency;
    }

    return { oscillator, gain: gainNode, panner: panNode };
  } catch (error) {
    console.error("Error creating oscillator chain:", error);
    return {
      oscillator: null,
      gain: null,
      panner: null,
    };
  }
}

function createNoiseChain(
  context: AudioContext,
  settings: NoiseSettings,
  targetFrequency: number
): {
  noiseNode: AudioWorkletNode | null;
  noiseGain: GainNode | null;
  noisePanner: StereoPannerNode | null;
  noiseFilter: BiquadFilterNode | null;
} {
  if (settings.volume <= 0) {
    return {
      noiseNode: null,
      noiseGain: null,
      noisePanner: null,
      noiseFilter: null,
    };
  }

  try {
    // Validate input parameters
    if (!Number.isFinite(targetFrequency) || targetFrequency <= 0) {
      targetFrequency = 440; // Default to A4 if invalid
    }

    const processorName =
      settings.type === "pink"
        ? "pink-noise-processor"
        : "white-noise-processor";

    // Create nodes with optimized settings
    const noiseNode = new AudioWorkletNode(context, processorName, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: {
        bufferSize: 128,
        reuseBuffers: true,
        // Use Float32Array for internal processing
        useFloat32Array: true,
      },
    });

    // Use createGainNode helper for consistent gain node creation
    const noiseGain = createGainNode(context, settings.volume);
    const noisePanner = context.createStereoPanner();

    // Validate pan value using Float32Array for calculations
    const panValue = Math.max(-1, Math.min(1, settings.pan));
    noisePanner.pan.value = panValue;

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "lowpass";

    // Calculate filter frequency with bounds checking using Float32Array
    let freq;
    if (settings.sync) {
      const toneMultiplier = settings.tone / 440;
      freq = targetFrequency * toneMultiplier;
    } else {
      freq = settings.tone;
    }

    // Ensure frequency is within valid range
    freq = Math.max(20, Math.min(freq, 20000));

    // Double check the result is finite
    if (!Number.isFinite(freq)) {
      freq = settings.tone; // Fallback to direct tone value
    }

    noiseFilter.frequency.value = freq;
    noiseFilter.Q.value = 1;

    // Connect nodes with error handling
    try {
      noiseNode.connect(noiseGain);
      noiseGain.connect(noiseFilter);
      noiseFilter.connect(noisePanner);
    } catch (e) {
      // Cleanup on connection error
      noiseNode.disconnect();
      noiseGain.disconnect();
      noiseFilter.disconnect();
      noisePanner.disconnect();
      return {
        noiseNode: null,
        noiseGain: null,
        noisePanner: null,
        noiseFilter: null,
      };
    }

    return { noiseNode, noiseGain, noisePanner, noiseFilter };
  } catch (error) {
    console.error("Error creating noise chain:", error);
    return {
      noiseNode: null,
      noiseGain: null,
      noisePanner: null,
      noiseFilter: null,
    };
  }
}

// Optimize LFO gain updates with Float32Array
function updateLFOGains(
  noteData: NoteData,
  modAmount: number,
  lfoDepth: number,
  baseCutoff: number,
  currentTime: number
): void {
  if (!noteData.lfoGains) {
    return;
  }

  const smoothingTime = 0.2;
  const delayTime = 0.02;

  // Pre-calculate common values using Float32Array
  // Scale down modAmount when it's at maximum (100%)
  const scaledModAmount = modAmount === 1 ? 0.7 : modAmount;
  const modDepth = scaledModAmount * lfoDepth;
  const filterModAmount = baseCutoff * 0.02;

  // Create a Float32Array for gain values
  const gainValues = new Float32Array(4);
  gainValues[0] = filterModAmount; // filterCutoff
  gainValues[1] = 0.5; // filterResonance
  gainValues[2] = 0.5; // oscillatorPitch
  gainValues[3] = 0.05; // oscillatorVolume

  // Scale oscillator pitch modulation based on range
  if (noteData.oscillators[0]) {
    const freq = noteData.oscillators[0].frequency.value;
    const baseFreq =
      freq /
      getRangeMultiplier(noteData.oscillators[0].type === "sine" ? "8" : "8");
    // Scale modulation inversely with frequency ratio
    const freqRatio = freq / baseFreq;
    gainValues[2] = Math.min(0.5, 0.5 / Math.sqrt(freqRatio));
  }

  const lfoGainConfigs = [
    {
      gain: noteData.lfoGains.filterCutoff.gain,
      multiplier: gainValues[0],
      name: "filterCutoff",
    },
    {
      gain: noteData.lfoGains.filterResonance.gain,
      multiplier: gainValues[1],
      name: "filterResonance",
    },
    {
      gain: noteData.lfoGains.oscillatorPitch.gain,
      multiplier: gainValues[2],
      name: "oscillatorPitch",
    },
    {
      gain: noteData.lfoGains.oscillatorVolume.gain,
      multiplier: gainValues[3],
      name: "oscillatorVolume",
    },
  ];

  // Batch process all gain updates
  lfoGainConfigs.forEach(({ gain, multiplier }) => {
    const targetValue = modDepth * multiplier;

    // Cancel any scheduled changes
    gain.cancelScheduledValues(currentTime);

    // Set current value
    gain.setValueAtTime(gain.value, currentTime);

    // Add a small delay before starting the change
    gain.setValueAtTime(gain.value, currentTime + delayTime);

    // Use linearRampToValueAtTime for smoother transitions
    gain.linearRampToValueAtTime(
      targetValue,
      currentTime + delayTime + smoothingTime
    );
  });
}

function updateModulation(
  synthContext: SynthContext,
  state: SynthState,
  modAmount: number
): void {
  if (!state.noteData || !state.noteData.lfo || !state.noteData.lfoGains) {
    return;
  }

  const baseCutoff = Math.min(
    Math.max(state.settings.filter.cutoff, 20),
    1541.27 // Maximum safe value for BiquadFilter gain
  );

  // If modulation is disabled (modAmount is 0), just disconnect gains
  if (modAmount === 0) {
    try {
      const gains = Object.values(state.noteData.lfoGains);
      gains.forEach((gain) => {
        gain.disconnect();
      });
    } catch (e) {
      console.warn("Error disconnecting LFO gains:", e);
    }
    return;
  }

  // Always reconnect LFO with current routing
  reconnectLFO(state.noteData, state.settings.lfo.routing);

  // Update LFO gains based on modulation amount
  updateLFOGains(
    state.noteData,
    modAmount,
    state.settings.lfo.depth,
    baseCutoff,
    synthContext.context.currentTime
  );
}

function updateSettings(
  state: SynthState,
  synthContext: SynthContext,
  newSettings: Partial<SynthSettings>
): void {
  state.settings = { ...state.settings, ...newSettings };

  if (state.noteData) {
    if (newSettings.oscillators && Array.isArray(newSettings.oscillators)) {
      const oscillators = newSettings.oscillators;
      const noteData = state.noteData;

      // Update pan settings
      noteData.oscillators.forEach(
        (osc: OscillatorNode | null, index: number) => {
          if (osc && index < oscillators.length) {
            const oscSettings = oscillators[index];
            if (
              oscSettings.pan !== undefined &&
              noteData.oscillatorPanners[index]
            ) {
              noteData.oscillatorPanners[index].pan.value = oscSettings.pan;
            }
          }
        }
      );

      // Update oscillator settings
      noteData.oscillators.forEach(
        (osc: OscillatorNode | null, index: number) => {
          if (osc && index < oscillators.length) {
            const oscSettings = oscillators[index];
            const volume = oscSettings.volume ?? 0;
            const enabled = oscSettings.enabled !== false;

            if (!enabled && osc) {
              try {
                // Disconnect the entire oscillator chain
                osc.disconnect();
                if (noteData.oscillatorGains[index]) {
                  noteData.oscillatorGains[index].disconnect();
                }
                if (noteData.oscillatorPanners[index]) {
                  noteData.oscillatorPanners[index].disconnect();
                }
                // Stop the oscillator to save CPU
                osc.stop();
                noteData.oscillators[index] = null as unknown as OscillatorNode;
                noteData.oscillatorGains[index] = null as unknown as GainNode;
                noteData.oscillatorPanners[index] =
                  null as unknown as StereoPannerNode;
              } catch (e) {
                console.warn("Error cleaning up oscillator:", e);
              }
            } else if (!osc && enabled && volume > 0) {
              // Create new oscillator chain
              const newOsc = createOscillator(
                synthContext.context,
                oscSettings,
                noteToFrequency(state.currentNote!, state.settings.octave)
              );
              const newGain = createGainNode(synthContext.context, volume);
              const newPanner = synthContext.context.createStereoPanner();
              newPanner.pan.value = oscSettings.pan ?? 0;

              newOsc.connect(newGain);
              newGain.connect(newPanner);
              if (noteData.gainNode) {
                newPanner.connect(noteData.gainNode);
              }
              newOsc.start();
              noteData.oscillators[index] = newOsc;
              noteData.oscillatorGains[index] = newGain;
              noteData.oscillatorPanners[index] = newPanner;
            } else if (osc && enabled && volume > 0) {
              // Update existing oscillator
              osc.type = oscSettings.waveform;
              const rangeMultiplier = getRangeMultiplier(oscSettings.range);
              const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
              const newFrequency =
                noteToFrequency(state.currentNote!, state.settings.octave) *
                rangeMultiplier *
                frequencyOffset;
              osc.frequency.value = newFrequency;
              osc.detune.value = oscSettings.detune ?? 0;

              if (noteData.oscillatorGains[index]) {
                noteData.oscillatorGains[index].gain.value = volume;
              }
            }
          }
        }
      );
    }
  }

  if (newSettings.modMix !== undefined || newSettings.modWheel !== undefined) {
    const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
    updateModulation(synthContext, state, modAmount);
  }

  // Handle effects cleanup when amount is 0
  if (newSettings.distortion) {
    if (newSettings.distortion.outputGain !== undefined) {
      const mix = newSettings.distortion.outputGain / 100;
      const logMix = Math.pow(mix, 2);
      synthContext.dryGain.gain.value = 1 - logMix;
      synthContext.wetGain.gain.value = logMix;

      // Only disconnect if mix is 0, otherwise ensure connection
      if (mix === 0) {
        try {
          synthContext.distortionLowEQ.disconnect();
          synthContext.distortionHighEQ.disconnect();
          synthContext.distortion.disconnect();
          synthContext.compressor.disconnect();
        } catch (e) {
          console.warn("Error cleaning up distortion:", e);
        }
      } else {
        // Reconnect if needed
        try {
          // Reconnect the full distortion chain
          synthContext.masterGain.connect(synthContext.distortionLowEQ);
          synthContext.distortionLowEQ.connect(synthContext.distortion);
          synthContext.distortion.connect(synthContext.distortionHighEQ);
          synthContext.distortionHighEQ.connect(synthContext.compressor);
          synthContext.compressor.connect(synthContext.wetGain);
        } catch (e) {
          console.warn("Error reconnecting distortion:", e);
        }
      }
    }
    if (newSettings.distortion.lowEQ !== undefined) {
      const eqValue = (newSettings.distortion.lowEQ - 50) * (24 / 100);
      synthContext.distortionLowEQ.gain.value = eqValue;
    }
    if (newSettings.distortion.highEQ !== undefined) {
      const eqValue = (newSettings.distortion.highEQ - 50) * (24 / 100);
      synthContext.distortionHighEQ.gain.value = eqValue;
    }
  }

  if (newSettings.reverb) {
    if (newSettings.reverb.amount !== undefined) {
      const amount = newSettings.reverb.amount / 100;
      synthContext.reverbGain.gain.value = amount;

      // Only disconnect if amount is 0, otherwise ensure connection
      if (amount === 0) {
        try {
          synthContext.reverbNode.disconnect();
          synthContext.reverbEQ.disconnect();
        } catch (e) {
          console.warn("Error cleaning up reverb:", e);
        }
      } else {
        // Reconnect if needed
        try {
          synthContext.reverbNode.connect(synthContext.reverbEQ);
          synthContext.reverbEQ.connect(synthContext.reverbGain);
        } catch (e) {
          console.warn("Error reconnecting reverb:", e);
        }
      }
    }
    if (newSettings.reverb.decay !== undefined && synthContext.reverbNode) {
      synthContext.reverbNode.buffer = synthContext.createImpulseResponse(
        newSettings.reverb.decay
      );
    }
    if (newSettings.reverb.eq !== undefined) {
      const eqValue = (newSettings.reverb.eq - 50) * (24 / 100);
      synthContext.reverbEQ.gain.value = eqValue;
    }
  }

  if (newSettings.delay) {
    if (newSettings.delay.amount !== undefined) {
      const amount = newSettings.delay.amount / 100;
      synthContext.delayGain.gain.value = amount;

      // Only disconnect if amount is 0, otherwise ensure connection
      if (amount === 0) {
        try {
          synthContext.delayNode.disconnect();
          synthContext.delayFeedback.disconnect();
        } catch (e) {
          console.warn("Error cleaning up delay:", e);
        }
      } else {
        // Reconnect if needed
        try {
          synthContext.delayNode.connect(synthContext.delayGain);
          synthContext.delayNode.connect(synthContext.delayFeedback);
          synthContext.delayFeedback.connect(synthContext.delayNode);
        } catch (e) {
          console.warn("Error reconnecting delay:", e);
        }
      }
    }
    if (newSettings.delay.time !== undefined) {
      synthContext.delayNode.delayTime.value = newSettings.delay.time;
    }
    if (newSettings.delay.feedback !== undefined) {
      synthContext.delayFeedback.gain.value = newSettings.delay.feedback / 100;
    }
  }

  if (newSettings.noise) {
    // Update state first
    if (newSettings.noise.sync !== undefined) {
      state.settings.noise.sync = newSettings.noise.sync;
    }
    if (newSettings.noise.tone !== undefined) {
      state.settings.noise.tone = newSettings.noise.tone;
    }
    if (newSettings.noise.volume !== undefined) {
      const newVolume = newSettings.noise.volume;
      const oldVolume = synthContext.noiseGain.gain.value;
      synthContext.noiseGain.gain.value = newVolume;

      if (oldVolume > 0 && newVolume === 0) {
        // Clean up noise nodes when disabled
        try {
          // Disconnect from the audio chain
          if (synthContext.noiseNode) {
            synthContext.noiseNode.disconnect();
            synthContext.noiseNode = null;
          }
          synthContext.noiseGain.disconnect();
          synthContext.noisePanner.disconnect();

          // Also clean up any active note's noise chain
          if (state.noteData?.noiseNode) {
            state.noteData.noiseNode.disconnect();
            state.noteData.noiseNode = null;
          }
          if (state.noteData?.noiseGain) {
            state.noteData.noiseGain.disconnect();
            state.noteData.noiseGain = null;
          }
          if (state.noteData?.noisePanner) {
            state.noteData.noisePanner.disconnect();
            state.noteData.noisePanner = null;
          }
          if (state.noteData?.noiseFilter) {
            state.noteData.noiseFilter.disconnect();
            state.noteData.noiseFilter = null;
          }
        } catch (e) {
          console.warn("Error cleaning up noise:", e);
        }
      }
    }
    if (newSettings.noise.pan !== undefined) {
      synthContext.noisePanner.pan.value = newSettings.noise.pan;
    }
    if (newSettings.noise.type !== undefined) {
      state.settings.noise.type = newSettings.noise.type;
    }
    if (
      newSettings.noise.tone !== undefined ||
      newSettings.noise.sync !== undefined
    ) {
      // Update tone for active note
      if (state.noteData?.noiseFilter && state.currentNote) {
        const noteFreq = noteToFrequency(
          state.currentNote,
          state.settings.octave
        );
        let freq;

        if (state.settings.noise.sync) {
          const toneMultiplier = state.settings.noise.tone / 440;
          freq = noteFreq * toneMultiplier;
        } else {
          freq = state.settings.noise.tone;
        }

        freq = Math.max(20, Math.min(freq, 20000));
        state.noteData.noiseFilter.frequency.value = freq;
      }
    }
  }

  if (state.noteData && state.currentNote) {
    const baseFrequency = noteToFrequency(
      state.currentNote,
      state.settings.octave
    );

    state.noteData.oscillators.forEach((osc, index) => {
      if (index < state.settings.oscillators.length) {
        const oscSettings = state.settings.oscillators[index];
        const volume = oscSettings.volume ?? 0;

        if (!state.noteData) return;
        if (volume === 0 && osc) {
          osc.stop();
          osc.disconnect();
          if (state.noteData?.oscillatorGains[index]) {
            state.noteData.oscillatorGains[index].disconnect();
          }
          state.noteData.oscillators[index] = null as unknown as OscillatorNode;
          state.noteData.oscillatorGains[index] = null as unknown as GainNode;
        } else if (volume > 0 && !osc) {
          const newOsc = createOscillator(
            synthContext.context,
            oscSettings,
            baseFrequency
          );
          const newGain = createGainNode(synthContext.context, volume);
          newOsc.connect(newGain);
          newGain.connect(state.noteData.gainNode);
          newOsc.start();
          state.noteData.oscillators[index] = newOsc;
          state.noteData.oscillatorGains[index] = newGain;
        } else if (osc && volume > 0) {
          osc.type = oscSettings.waveform;
          const rangeMultiplier = getRangeMultiplier(oscSettings.range);
          const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
          const newFrequency =
            baseFrequency * rangeMultiplier * frequencyOffset;
          osc.frequency.value = newFrequency;
          osc.detune.value = oscSettings.detune ?? 0;

          if (state.noteData.oscillatorGains[index]) {
            state.noteData.oscillatorGains[index].gain.value = volume;
          }
        }
      }
    });

    if (state.noteData.filterNode) {
      if (
        newSettings.filter?.cutoff !== undefined ||
        newSettings.filter?.resonance !== undefined ||
        newSettings.filter?.type !== undefined
      ) {
        if (newSettings.filter?.cutoff !== undefined) {
          state.noteData.filterNode.frequency.value = newSettings.filter.cutoff;
        }
        if (newSettings.filter?.resonance !== undefined) {
          const baseQ = newSettings.filter.resonance * 30;
          if (newSettings.filter?.type === "notch") {
            state.noteData.filterNode.Q.value = baseQ * 2;
          } else if (newSettings.filter?.type === "bandpass") {
            state.noteData.filterNode.Q.value = baseQ * 1.5;
          } else {
            state.noteData.filterNode.Q.value = baseQ;
          }
        }
        if (newSettings.filter?.type !== undefined) {
          state.noteData.filterNode.type = newSettings.filter.type;
          // Update Q value when filter type changes
          const baseQ = state.settings.filter.resonance * 30;
          if (newSettings.filter.type === "notch") {
            state.noteData.filterNode.Q.value = baseQ * 2;
          } else if (newSettings.filter.type === "bandpass") {
            state.noteData.filterNode.Q.value = baseQ * 1.5;
          } else {
            state.noteData.filterNode.Q.value = baseQ;
          }
        }
      }
    }

    if (state.noteData.lfo) {
      state.noteData.lfo.type = state.settings.lfo.waveform;
      state.noteData.lfo.frequency.value = state.settings.lfo.rate;
    }
  }

  if (
    newSettings.lfo?.waveform !== undefined ||
    newSettings.lfo?.rate !== undefined ||
    newSettings.lfo?.depth !== undefined ||
    newSettings.lfo?.routing !== undefined
  ) {
    // Update LFO settings for active note
    if (state.noteData?.lfo) {
      if (newSettings.lfo?.waveform !== undefined) {
        state.noteData.lfo.type = newSettings.lfo.waveform;
      }
      if (newSettings.lfo?.rate !== undefined) {
        state.noteData.lfo.frequency.value = newSettings.lfo.rate;
      }
      if (newSettings.lfo?.routing !== undefined) {
        reconnectLFO(state.noteData, newSettings.lfo.routing);
      }
    }

    // Update modulation amount for active note
    const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
    updateModulation(synthContext, state, modAmount);
  }

  if (newSettings.octave !== undefined) {
    state.settings.octave = newSettings.octave;
  }
}

function handleNoteTransition(
  state: SynthState,
  synthContext: SynthContext,
  fromNote: Note | null,
  toNote: Note
): void {
  const now = synthContext.context.currentTime;

  // Calculate the last frequency from the fromNote if available
  let lastFrequency = null;
  if (fromNote) {
    lastFrequency = noteToFrequency(fromNote, state.settings.octave);
  } else if (state.currentNote && state.noteData) {
    // Fallback to current oscillator frequency if no fromNote
    const activeOsc = state.noteData.oscillators[0];
    if (activeOsc) {
      lastFrequency = activeOsc.frequency.value;
    }
  }

  // If we have an existing note, smoothly transition its frequency
  if (state.noteData && state.currentNote) {
    const targetFrequency = noteToFrequency(toNote, state.settings.octave);

    // Update all oscillators to the new frequency
    state.noteData.oscillators.forEach((osc, index) => {
      if (osc && index < state.settings.oscillators.length) {
        const oscSettings = state.settings.oscillators[index];
        const rangeMultiplier = getRangeMultiplier(oscSettings.range);
        const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
        const newFrequency =
          targetFrequency * rangeMultiplier * frequencyOffset;

        // Cancel any existing scheduled changes
        osc.frequency.cancelScheduledValues(now);

        // Set the current value
        osc.frequency.setValueAtTime(osc.frequency.value, now);

        // Schedule the frequency change with a longer transition time
        osc.frequency.linearRampToValueAtTime(newFrequency, now + 0.05); // 50ms transition
      }
    });

    // Update the current note
    state.currentNote = toNote;
  } else {
    // If no existing note, start a new one
    triggerAttack(state, synthContext, toNote, lastFrequency);
  }
}

function triggerAttack(
  state: SynthState,
  synthContext: SynthContext,
  note: Note,
  lastFrequency: number | null = null
): void {
  const now = synthContext.context.currentTime;

  // Clean up any existing note data before creating new one
  if (state.noteData) {
    // Store the current frequency before cleanup
    const currentFreq = state.noteData.oscillators[0]?.frequency.value;
    if (currentFreq) {
      state.lastPlayedFrequency = currentFreq;
    }

    // Create a copy of the old note data for cleanup
    const oldNoteData = { ...state.noteData };
    state.noteData = null;

    // Smoothly fade out old oscillators and noise
    oldNoteData.oscillatorGains.forEach((gain) => {
      if (gain) {
        const currentValue = gain.gain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(currentValue, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1); // Increased to 100ms
      }
    });

    if (oldNoteData.noiseGain) {
      const currentValue = oldNoteData.noiseGain.gain.value;
      oldNoteData.noiseGain.gain.cancelScheduledValues(now);
      oldNoteData.noiseGain.gain.setValueAtTime(currentValue, now);
      oldNoteData.noiseGain.gain.linearRampToValueAtTime(0, now + 0.1); // Increased to 100ms
    }

    // Schedule cleanup of old oscillators and noise
    setTimeout(() => {
      oldNoteData.oscillators.forEach((osc) => {
        if (osc) {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {
            console.warn("Error cleaning up oscillator:", e);
          }
        }
      });

      if (oldNoteData.noiseNode) {
        try {
          oldNoteData.noiseNode.disconnect();
        } catch (e) {
          console.warn("Error cleaning up noise node:", e);
        }
      }
    }, 150); // Increased to ensure fade out is complete
  }

  state.noteState = {
    isPlaying: true,
    isReleased: false,
    startTime: now,
    releaseTime: null,
  };
  state.currentNote = note;

  const hasActiveOscillators = state.settings.oscillators.some(
    (osc: { volume?: number }) => (osc.volume ?? 0) > 0
  );
  const hasNoise = state.settings.noise.volume > 0;
  if (!hasActiveOscillators && !hasNoise) {
    return;
  }

  const targetFrequency = noteToFrequency(note, state.settings.octave);

  // Use lastPlayedFrequency for glide if available and no explicit lastFrequency
  const glideStartFrequency = lastFrequency ?? state.lastPlayedFrequency;

  // Create main audio chain
  const noteGain = createGainNode(synthContext.context, 0); // Start at 0 for envelope
  const filter = synthContext.context.createBiquadFilter();
  const baseCutoff = Math.min(
    Math.max(state.settings.filter.cutoff, 20),
    1541.27 // Maximum safe value for BiquadFilter gain
  );
  filter.type = state.settings.filter.type;
  filter.frequency.value = baseCutoff;

  // Set initial filter resonance
  const baseQ = state.settings.filter.resonance * 30;
  if (state.settings.filter.type === "notch") {
    filter.Q.value = baseQ * 2;
  } else if (state.settings.filter.type === "bandpass") {
    filter.Q.value = baseQ * 1.5;
  } else {
    filter.Q.value = baseQ;
  }

  // Create oscillator chains
  const oscillatorChains = state.settings.oscillators.map(
    (oscSettings: OscillatorSettings) => {
      if ((oscSettings.volume ?? 0) <= 0) {
        return {
          oscillator: null,
          gain: null,
          panner: null,
        };
      }

      return createOscillatorChain(
        synthContext.context,
        oscSettings,
        targetFrequency,
        now,
        glideStartFrequency,
        state.settings.glide
      );
    }
  );

  // Create noise chain if enabled
  let noiseChain = null;
  if (state.settings.noise.volume > 0) {
    noiseChain = createNoiseChain(
      synthContext.context,
      state.settings.noise,
      targetFrequency
    );
  }

  // Connect oscillators to filter
  oscillatorChains.forEach(({ oscillator, gain, panner }: OscillatorChain) => {
    if (oscillator && gain && panner) {
      panner.connect(filter);
    }
  });

  // Connect noise to filter if it exists
  if (noiseChain?.noisePanner) {
    noiseChain.noisePanner.connect(filter);
  }

  // Connect filter to gain node
  filter.connect(noteGain);

  // Connect gain node to master output
  noteGain.connect(synthContext.masterGain);

  // Set up amplitude envelope
  noteGain.gain.setValueAtTime(0, now);
  noteGain.gain.linearRampToValueAtTime(
    1,
    now + state.settings.envelope.attack
  );
  noteGain.gain.linearRampToValueAtTime(
    state.settings.envelope.sustain,
    now + state.settings.envelope.attack + state.settings.envelope.decay
  );

  // Create LFO
  const lfo = synthContext.context.createOscillator();
  lfo.type = state.settings.lfo.waveform;
  lfo.frequency.value = state.settings.lfo.rate;

  // Create LFO gains
  const lfoGains = {
    filterCutoff: createGainNode(synthContext.context, 0),
    filterResonance: createGainNode(synthContext.context, 0),
    oscillatorPitch: createGainNode(synthContext.context, 0),
    oscillatorVolume: createGainNode(synthContext.context, 0),
  };

  // Connect LFO to gains
  lfo.connect(lfoGains.filterCutoff);
  lfo.connect(lfoGains.filterResonance);
  lfo.connect(lfoGains.oscillatorPitch);
  lfo.connect(lfoGains.oscillatorVolume);

  // Start LFO
  lfo.start();

  // Create the note data object
  const noteData: NoteData = {
    oscillators: oscillatorChains
      .map((chain: OscillatorChain) => chain.oscillator)
      .filter((osc): osc is OscillatorNode => osc !== null),
    oscillatorGains: oscillatorChains
      .map((chain: OscillatorChain) => chain.gain)
      .filter((gain): gain is GainNode => gain !== null),
    oscillatorPanners: oscillatorChains
      .map((chain: OscillatorChain) => chain.panner)
      .filter((panner): panner is StereoPannerNode => panner !== null),
    gainNode: noteGain,
    filterNode: filter,
    lfo: lfo,
    lfoGains: lfoGains,
    filterEnvelope: createGainNode(synthContext.context, 0),
    filterModGain: createGainNode(synthContext.context, 0),
    noiseNode: noiseChain?.noiseNode ?? null,
    noiseGain: noiseChain?.noiseGain ?? null,
    noisePanner: noiseChain?.noisePanner ?? null,
    noiseFilter: noiseChain?.noiseFilter ?? null,
  };

  // Store the note data
  state.noteData = noteData;

  // Set up initial modulation
  const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
  if (modAmount > 0) {
    reconnectLFO(noteData, state.settings.lfo.routing);
    updateLFOGains(
      noteData,
      modAmount,
      state.settings.lfo.depth,
      baseCutoff,
      now
    );
  }
}

function triggerRelease(
  state: SynthState,
  synthContext: SynthContext,
  note: Note
): void {
  if (
    !state.noteData ||
    !state.noteState ||
    state.noteState.isReleased ||
    state.currentNote !== note
  )
    return;

  const now = synthContext.context.currentTime;
  state.noteState.isReleased = true;
  state.noteState.releaseTime = now;

  // Create a copy of the note data for cleanup
  const noteDataToCleanup = { ...state.noteData };

  // Handle amplitude envelope release
  if (noteDataToCleanup.gainNode) {
    const currentValue = noteDataToCleanup.gainNode.gain.value;
    noteDataToCleanup.gainNode.gain.cancelScheduledValues(now);
    noteDataToCleanup.gainNode.gain.setValueAtTime(currentValue, now);
    noteDataToCleanup.gainNode.gain.linearRampToValueAtTime(
      0,
      now + state.settings.envelope.release
    );
  }

  // Handle filter envelope release if enabled
  if (noteDataToCleanup.filterNode && state.settings.filter.contourAmount > 0) {
    const baseCutoff = Math.min(
      Math.max(state.settings.filter.cutoff, 20),
      1541.27
    );
    const currentCutoff = noteDataToCleanup.filterNode.frequency.value;
    noteDataToCleanup.filterNode.frequency.cancelScheduledValues(now);
    noteDataToCleanup.filterNode.frequency.setValueAtTime(currentCutoff, now);
    noteDataToCleanup.filterNode.frequency.linearRampToValueAtTime(
      baseCutoff,
      now + state.settings.envelope.release
    );
  }

  // Clean up LFO if it exists
  if (noteDataToCleanup.lfo) {
    try {
      noteDataToCleanup.lfo.stop();
      noteDataToCleanup.lfo.disconnect();
    } catch (e) {
      console.warn("Error cleaning up LFO:", e);
    }
  }

  // Clean up LFO gains
  if (noteDataToCleanup.lfoGains) {
    Object.values(noteDataToCleanup.lfoGains).forEach((gain) => {
      try {
        gain.disconnect();
      } catch (e) {
        console.warn("Error cleaning up LFO gain:", e);
      }
    });
  }

  // Clean up noise if it exists
  if (noteDataToCleanup.noiseGain) {
    const currentValue = noteDataToCleanup.noiseGain.gain.value;
    noteDataToCleanup.noiseGain.gain.cancelScheduledValues(now);
    noteDataToCleanup.noiseGain.gain.setValueAtTime(currentValue, now);
    noteDataToCleanup.noiseGain.gain.linearRampToValueAtTime(
      0,
      now + state.settings.envelope.release
    );
  }

  // Schedule cleanup after the release is complete
  setTimeout(() => {
    // Only cleanup if this is still the note that was released
    if (
      !state.noteState ||
      !state.noteState.isReleased ||
      state.currentNote !== note
    ) {
      return;
    }

    // Cleanup oscillators
    noteDataToCleanup.oscillators.forEach((osc) => {
      if (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          console.warn("Error cleaning up oscillator:", e);
        }
      }
    });

    // Cleanup noise
    if (noteDataToCleanup.noiseNode) {
      try {
        noteDataToCleanup.noiseNode.disconnect();
      } catch (e) {
        console.warn("Error cleaning up noise node:", e);
      }
    }
    if (noteDataToCleanup.noiseGain) {
      try {
        noteDataToCleanup.noiseGain.disconnect();
      } catch (e) {
        console.warn("Error cleaning up noise gain:", e);
      }
    }
    if (noteDataToCleanup.noisePanner) {
      try {
        noteDataToCleanup.noisePanner.disconnect();
      } catch (e) {
        console.warn("Error cleaning up noise panner:", e);
      }
    }
    if (noteDataToCleanup.noiseFilter) {
      try {
        noteDataToCleanup.noiseFilter.disconnect();
      } catch (e) {
        console.warn("Error cleaning up noise filter:", e);
      }
    }

    // Cleanup filter
    if (noteDataToCleanup.filterNode) {
      noteDataToCleanup.filterNode.disconnect();
    }

    // Cleanup main nodes
    if (noteDataToCleanup.gainNode) {
      noteDataToCleanup.gainNode.disconnect();
    }

    // Only clear state if this is still the current note
    if (state.currentNote === note) {
      state.currentNote = null;
      state.noteState = null;
      state.noteData = null;
    }
  }, state.settings.envelope.release * 1000 + 150); // Increased buffer to ensure complete release
}

function dispose(state: SynthState, synthContext: SynthContext): void {
  if (state.activeNotes) {
    state.activeNotes.forEach((_, note: Note) =>
      triggerRelease(state, synthContext, note)
    );
  }
  if (state.noteStates) {
    state.noteStates.clear();
  }
  synthContext.masterGain.disconnect();
  synthContext.context.close();
}

// Factory function to create a synth
export async function createSynth() {
  const synthContext = createSynthContext(new AudioContext());
  const state = createInitialState();

  // Load both noise processors
  try {
    await synthContext.context.audioWorklet.addModule(
      "/white-noise-processor.js"
    );
    await synthContext.context.audioWorklet.addModule(
      "/pink-noise-processor.js"
    );
  } catch (error) {
    console.error("Failed to load noise processors:", error);
  }

  return {
    triggerAttack: (note: Note) => triggerAttack(state, synthContext, note),
    triggerRelease: (note: Note) => triggerRelease(state, synthContext, note),
    updateSettings: (newSettings: Partial<SynthSettings>) =>
      updateSettings(state, synthContext, newSettings),
    dispose: () => dispose(state, synthContext),
    handleNoteTransition: (fromNote: Note | null, toNote: Note) =>
      handleNoteTransition(state, synthContext, fromNote, toNote),
  };
}
