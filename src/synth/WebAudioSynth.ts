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
  reverbGain: GainNode;
  dryGain: GainNode;
  wetGain: GainNode;
  noiseNode: AudioWorkletNode | null;
  noiseGain: GainNode;
  noisePanner: StereoPannerNode;
  reverbNode: ConvolverNode;
  reverbEQ: BiquadFilterNode;
  createImpulseResponse: (decay: number) => AudioBuffer;
};

type SynthState = {
  currentNote: Note | null;
  noteState: NoteState | null;
  noteData: NoteData | null;
  settings: SynthSettings;
  activeNotes: Map<Note, NoteData>;
  noteStates: Map<Note, NoteState>;
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
    reverbGain: effects.reverbGain,
    dryGain: effects.dryGain,
    wetGain: effects.wetGain,
    noiseNode: null,
    noiseGain,
    noisePanner,
    reverbNode: effects.reverbNode,
    reverbEQ: effects.reverbEQ,
    createImpulseResponse: effects.createImpulseResponse,
  };
}

function createInitialState(): SynthState {
  return {
    currentNote: null,
    noteState: null,
    noteData: null,
    settings: {
      tune: 0,
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
      },
      distortion: {
        outputGain: 0,
      },
      delay: {
        amount: 0,
      },
    },
    activeNotes: new Map(),
    noteStates: new Map(),
  };
}

function createLFOConnections(
  noteData: NoteData,
  routing: LFORouting
): LFOConnection[] {
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

function updateLFOConnections(noteData: NoteData, routing: LFORouting): void {
  const connections = createLFOConnections(noteData, routing);

  // First disconnect all connections
  connections.forEach(({ source }) => {
    source.disconnect();
  });

  // Then connect enabled ones
  connections
    .filter(({ enabled, target }) => enabled && target)
    .forEach(({ source, target }) => {
      source.connect(target);
    });
}

function reconnectLFO(noteData: NoteData, routing: LFORouting): void {
  updateLFOConnections(noteData, routing);
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
  if ((oscSettings.volume ?? 0) <= 0) {
    return {
      oscillator: null,
      gain: null,
      panner: null,
    };
  }

  const rangeMultiplier = getRangeMultiplier(oscSettings.range);
  const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
  const finalFrequency = baseFrequency * rangeMultiplier * frequencyOffset;
  const startFrequency =
    glide > 0 && lastFrequency
      ? lastFrequency * rangeMultiplier * frequencyOffset
      : finalFrequency;

  const oscillator = createOscillator(
    context,
    {
      ...oscSettings,
      type: oscSettings.waveform,
    },
    startFrequency
  );

  const gain = createGainNode(context, oscSettings.volume ?? 0);
  const panner = context.createStereoPanner();
  panner.pan.value = oscSettings.pan ?? 0;

  oscillator.connect(gain);
  gain.connect(panner);
  oscillator.start(startTime);

  if (glide > 0 && lastFrequency) {
    const glideTime = glide * 0.5;
    oscillator.frequency.linearRampToValueAtTime(
      finalFrequency,
      startTime + glideTime
    );
  }

  return { oscillator, gain, panner };
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
    const noiseNode = new AudioWorkletNode(context, processorName);
    const noiseGain = createGainNode(context, settings.volume);
    const noisePanner = context.createStereoPanner();

    // Validate pan value
    const panValue = Math.max(-1, Math.min(1, settings.pan));
    noisePanner.pan.value = panValue;

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "lowpass";

    // Calculate filter frequency
    let freq;
    if (settings.sync) {
      // When sync is enabled, use tone as a multiplier of the note frequency
      // Map tone (20-20000) to a multiplier (0.045-45)
      const toneMultiplier = settings.tone / 440;
      freq = targetFrequency * toneMultiplier;
    } else {
      // When sync is disabled, use tone directly as the filter frequency
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

    noiseNode.connect(noiseGain);
    noiseGain.connect(noiseFilter);
    noiseFilter.connect(noisePanner);

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

function updateModulation(
  synthContext: SynthContext,
  state: SynthState,
  modAmount: number
): void {
  const baseCutoff = Math.min(
    Math.max(state.settings.filter.cutoff, 20),
    1541.27 // Maximum safe value for BiquadFilter gain
  );

  if (!state.noteData || !state.noteData.lfo) {
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

function updateLFOGains(
  noteData: NoteData,
  modAmount: number,
  lfoDepth: number,
  baseCutoff: number,
  currentTime: number
): void {
  const smoothingTime = 0.01;

  const lfoGainConfigs = [
    {
      gain: noteData.lfoGains.filterCutoff.gain,
      multiplier: baseCutoff,
      name: "filterCutoff",
    },
    {
      gain: noteData.lfoGains.filterResonance.gain,
      multiplier: 30,
      name: "filterResonance",
    },
    {
      gain: noteData.lfoGains.oscillatorPitch.gain,
      multiplier: 100,
      name: "oscillatorPitch",
    },
    {
      gain: noteData.lfoGains.oscillatorVolume.gain,
      multiplier: 1,
      name: "oscillatorVolume",
    },
  ];

  lfoGainConfigs.forEach(({ gain, multiplier }) => {
    const targetValue = modAmount * lfoDepth * multiplier;
    gain.setTargetAtTime(targetValue, currentTime, smoothingTime);
  });
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
      const noteData = state.noteData; // Create a local reference to avoid null checks

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

            if (volume === 0 && osc) {
              osc.stop();
              osc.disconnect();
              if (noteData.oscillatorGains[index]) {
                noteData.oscillatorGains[index].disconnect();
              }
              noteData.oscillators[index] = null as unknown as OscillatorNode;
              noteData.oscillatorGains[index] = null as unknown as GainNode;
            } else if (volume > 0 && !osc) {
              const newOsc = createOscillator(
                synthContext.context,
                oscSettings,
                noteToFrequency(state.currentNote!, state.settings.tune)
              );
              const newGain = createGainNode(synthContext.context, volume);
              newOsc.connect(newGain);
              if (noteData.gainNode) {
                newGain.connect(noteData.gainNode);
              }
              newOsc.start();
              noteData.oscillators[index] = newOsc;
              noteData.oscillatorGains[index] = newGain;
            } else if (osc && volume > 0) {
              osc.type = oscSettings.waveform;
              const rangeMultiplier = getRangeMultiplier(oscSettings.range);
              const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
              const newFrequency =
                noteToFrequency(state.currentNote!, state.settings.tune) *
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

  if (newSettings.distortion) {
    if (newSettings.distortion.outputGain !== undefined) {
      const mix = newSettings.distortion.outputGain / 100;
      const logMix = Math.pow(mix, 2);
      synthContext.dryGain.gain.value = 1 - logMix;
      synthContext.wetGain.gain.value = logMix;
    }
  }

  if (newSettings.reverb) {
    if (newSettings.reverb.amount !== undefined) {
      synthContext.reverbGain.gain.value = newSettings.reverb.amount / 100;
    }
    if (newSettings.reverb.decay !== undefined && synthContext.reverbNode) {
      synthContext.reverbNode.buffer = synthContext.createImpulseResponse(
        newSettings.reverb.decay
      );
    }
    if (newSettings.reverb.eq !== undefined) {
      // Map EQ value from 0-100 to -12 to +12 dB
      const eqValue = (newSettings.reverb.eq - 50) * (24 / 100);
      synthContext.reverbEQ.gain.value = eqValue;
    }
  }

  if (newSettings.delay) {
    synthContext.delayGain.gain.value = newSettings.delay.amount / 100;
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
      synthContext.noiseGain.gain.value = newVolume;
    }
    if (newSettings.noise.pan !== undefined) {
      synthContext.noisePanner.pan.value = newSettings.noise.pan;
    }
    if (
      newSettings.noise.tone !== undefined ||
      newSettings.noise.sync !== undefined
    ) {
      // Update tone for active note
      if (state.noteData?.noiseFilter && state.currentNote) {
        const noteFreq = noteToFrequency(
          state.currentNote,
          state.settings.tune
        );
        let freq;

        if (state.settings.noise.sync) {
          // When sync is enabled, use tone as a multiplier of the note frequency
          // Map tone (20-20000) to a multiplier (0.045-45)
          const toneMultiplier = state.settings.noise.tone / 440;
          freq = noteFreq * toneMultiplier;
        } else {
          // When sync is disabled, use tone directly as the filter frequency
          freq = state.settings.noise.tone;
        }

        // Ensure frequency is within valid range
        freq = Math.max(20, Math.min(freq, 20000));
        state.noteData.noiseFilter.frequency.value = freq;
      }
    }
  }

  if (state.noteData && state.currentNote) {
    const baseFrequency = noteToFrequency(
      state.currentNote,
      state.settings.tune
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
}

function triggerAttack(
  state: SynthState,
  synthContext: SynthContext,
  note: Note
): void {
  const now = synthContext.context.currentTime;

  // If there's a current note, release it first
  if (state.currentNote) {
    triggerRelease(state, synthContext, state.currentNote);
  }

  state.noteState = {
    isPlaying: true,
    isReleased: false,
    startTime: now,
    releaseTime: null,
  };
  state.currentNote = note;

  const lastFrequency = state.currentNote
    ? noteToFrequency(state.currentNote, state.settings.tune)
    : null;

  const hasActiveOscillators = state.settings.oscillators.some(
    (osc: { volume?: number }) => (osc.volume ?? 0) > 0
  );
  if (!hasActiveOscillators) {
    return;
  }

  const targetFrequency = noteToFrequency(note, state.settings.tune);

  // Create main audio chain
  const noteGain = createGainNode(synthContext.context, 0);
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

  // Create noise chain
  const { noiseNode, noiseGain, noisePanner, noiseFilter } = createNoiseChain(
    synthContext.context,
    state.settings.noise,
    targetFrequency
  );

  // Create LFO
  const lfo = synthContext.context.createOscillator();
  lfo.type = state.settings.lfo.waveform;
  lfo.frequency.value = state.settings.lfo.rate;

  const lfoGains = {
    filterCutoff: createGainNode(synthContext.context, 0),
    filterResonance: createGainNode(synthContext.context, 0),
    oscillatorPitch: createGainNode(synthContext.context, 0),
    oscillatorVolume: createGainNode(synthContext.context, 0),
  };

  // Connect LFO
  Object.values(lfoGains).forEach((gain) => lfo.connect(gain));
  lfo.start();

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
        lastFrequency,
        state.settings.glide
      );
    }
  );

  // Connect everything
  const filterGain = createGainNode(
    synthContext.context,
    state.settings.filter.type === "bandpass" ? 4 : 1
  );

  // Connect oscillators to note gain
  oscillatorChains.forEach(({ oscillator, gain, panner }: OscillatorChain) => {
    if (oscillator && gain && panner) {
      panner.connect(noteGain);
    }
  });

  // Connect noise chain if present
  if (noiseNode && noiseGain && noisePanner) {
    noisePanner.connect(noteGain);
  }

  // Connect main signal chain
  noteGain.connect(filter);
  filter.connect(filterGain);
  filterGain.connect(synthContext.masterGain);

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
    lfo,
    lfoGains,
    filterEnvelope: createGainNode(synthContext.context, 0),
    filterModGain: createGainNode(synthContext.context, 0),
    noiseNode,
    noiseGain,
    noisePanner,
    noiseFilter,
  };

  // Set up LFO connections
  reconnectLFO(noteData, state.settings.lfo.routing);

  // Store the note data
  state.noteData = noteData;

  // Apply initial modulation
  const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
  updateModulation(synthContext, state, modAmount);
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

  // Handle gain and filter envelope release
  const handleRelease = (node: GainNode, currentValue: number) => {
    const releaseTime = now + state.settings.envelope.release;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(currentValue, now);
    node.gain.linearRampToValueAtTime(0, releaseTime);

    // Handle filter frequency release
    if (state.noteData?.filterNode) {
      state.noteData.filterNode.frequency.cancelScheduledValues(now);
      state.noteData.filterNode.frequency.setValueAtTime(
        state.noteData.filterNode.frequency.value,
        now
      );
      state.noteData.filterNode.frequency.linearRampToValueAtTime(
        state.settings.filter.cutoff,
        releaseTime
      );
    }
  };

  if (state.noteData.gainNode) {
    handleRelease(state.noteData.gainNode, state.noteData.gainNode.gain.value);
  }

  if (state.noteData.filterNode) {
    handleRelease(
      state.noteData.filterNode,
      state.noteData.filterNode.frequency.value
    );
  }

  if (state.noteData.noiseGain) {
    handleRelease(
      state.noteData.noiseGain,
      state.noteData.noiseGain.gain.value
    );
  }

  // Disconnect LFO connections
  state.noteData.lfo.stop();
  Object.values(state.noteData.lfoGains).forEach((gain) => gain.disconnect());

  // Cleanup function to handle node disconnection
  const disconnectNode = (node: AudioNode | null, nodeName: string) => {
    if (!node) return;
    try {
      node.disconnect();
    } catch (e) {
      console.warn(`Error stopping ${nodeName}:`, e);
    }
  };

  // Schedule cleanup after release
  setTimeout(() => {
    if (!state.noteState || !state.noteState.isReleased || !state.noteData)
      return;

    // Cleanup oscillators
    state.noteData.oscillators.forEach((osc) =>
      disconnectNode(osc, "oscillator")
    );

    // Cleanup main nodes
    disconnectNode(state.noteData.gainNode, "gain node");
    disconnectNode(state.noteData.filterNode, "filter");

    // Cleanup noise nodes
    disconnectNode(state.noteData.noiseNode, "noise node");
    disconnectNode(state.noteData.noiseGain, "noise gain");
    disconnectNode(state.noteData.noisePanner, "noise panner");

    state.currentNote = null;
    state.noteState = null;
    state.noteData = null;
  }, state.settings.envelope.release * 1000);
}

function handleNoteTransition(
  state: SynthState,
  synthContext: SynthContext,
  fromNote: Note | null,
  toNote: Note
): void {
  if (fromNote) {
    triggerRelease(state, synthContext, fromNote);
  }
  triggerAttack(state, synthContext, toNote);
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
export default async function createSynth() {
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
