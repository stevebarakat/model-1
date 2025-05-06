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
};

type SynthState = {
  activeNotes: Map<Note, NoteData>;
  noteStates: Map<Note, NoteState>;
  settings: SynthSettings;
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

function createSynthContext(): SynthContext {
  const context = new AudioContext();
  const { masterGain, delayGain, reverbGain, dryGain, wetGain } =
    setupEffects(context);
  const noiseGain = context.createGain();
  const noisePanner = context.createStereoPanner();
  noiseGain.connect(noisePanner);
  noisePanner.connect(masterGain);

  // Ensure master gain is connected to destination
  masterGain.connect(context.destination);

  return {
    context,
    masterGain,
    delayGain,
    reverbGain,
    dryGain,
    wetGain,
    noiseNode: null,
    noiseGain,
    noisePanner,
  };
}

function createInitialState(): SynthState {
  return {
    activeNotes: new Map<Note, NoteData>(),
    noteStates: new Map<Note, NoteState>(),
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
  };
}

function createLFOConnections(
  noteData: NoteData,
  routing: LFORouting
): LFOConnection[] {
  console.log("Creating LFO connections:", { routing });

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
  console.log("Updating LFO connections:", { routing });

  const connections = createLFOConnections(noteData, routing);

  // First disconnect all connections
  connections.forEach(({ source }) => {
    console.log("Disconnecting LFO gain:", source);
    source.disconnect();
  });

  // Then connect enabled ones
  connections
    .filter(({ enabled, target }) => enabled && target)
    .forEach(({ source, target }) => {
      console.log("Connecting LFO gain to target:", { source, target });
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
      console.warn("Invalid target frequency:", targetFrequency);
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
      console.warn("Calculated frequency is non-finite:", {
        targetFrequency,
        tone: settings.tone,
        calculatedFreq: freq,
      });
      freq = settings.tone; // Fallback to direct tone value
    }

    noiseFilter.frequency.value = freq;
    noiseFilter.Q.value = 1;

    noiseNode.connect(noiseGain);
    noiseGain.connect(noiseFilter);
    noiseFilter.connect(noisePanner);

    return { noiseNode, noiseGain, noisePanner, noiseFilter };
  } catch (error) {
    console.error("Failed to create noise node:", error, {
      settings,
      targetFrequency,
      context: context.state,
    });
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
  console.log("Updating modulation:", {
    modAmount,
    modWheel: state.settings.modWheel,
    modMix: state.settings.modMix,
  });

  const baseCutoff = Math.min(
    Math.max(state.settings.filter.cutoff, 20),
    20000
  );

  const updateNoteModulation = (noteData: NoteData) => {
    if (!noteData.lfo) {
      console.log("No LFO found for note");
      return;
    }

    console.log("Updating note modulation:", {
      lfoType: noteData.lfo.type,
      lfoRate: noteData.lfo.frequency.value,
      routing: state.settings.lfo.routing,
    });

    // Always reconnect LFO with current routing
    reconnectLFO(noteData, state.settings.lfo.routing);

    // Update LFO gains based on modulation amount
    updateLFOGains(
      noteData,
      modAmount,
      state.settings.lfo.depth,
      baseCutoff,
      synthContext.context.currentTime
    );
  };

  Array.from(state.activeNotes.values()).forEach(updateNoteModulation);
}

function updateLFOGains(
  noteData: NoteData,
  modAmount: number,
  lfoDepth: number,
  baseCutoff: number,
  currentTime: number
): void {
  console.log("Updating LFO gains:", { modAmount, lfoDepth, baseCutoff });

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

  lfoGainConfigs.forEach(({ gain, multiplier, name }) => {
    const targetValue = modAmount * lfoDepth * multiplier;
    console.log(`Setting ${name} gain:`, {
      targetValue,
      currentValue: gain.value,
    });
    gain.setTargetAtTime(targetValue, currentTime, smoothingTime);
  });
}

// Factory function to create a synth
export default async function createSynth() {
  const synthContext = createSynthContext();
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

  function updateSettings(newSettings: Partial<SynthSettings>): void {
    state.settings = { ...state.settings, ...newSettings };

    if (
      newSettings.modMix !== undefined ||
      newSettings.modWheel !== undefined
    ) {
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
      synthContext.reverbGain.gain.value = newSettings.reverb.amount / 100;
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
        // Update tone for all active notes
        state.activeNotes.forEach((noteData, note) => {
          if (noteData.noiseFilter) {
            const noteFreq = noteToFrequency(note, state.settings.tune);
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
            noteData.noiseFilter.frequency.value = freq;
          }
        });
      }
    }

    state.activeNotes.forEach((noteData, note) => {
      const baseFrequency = noteToFrequency(note, state.settings.tune);

      noteData.oscillators.forEach((osc, index) => {
        if (index < state.settings.oscillators.length) {
          const oscSettings = state.settings.oscillators[index];
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
              baseFrequency
            );
            const newGain = createGainNode(synthContext.context, volume);
            newOsc.connect(newGain);
            newGain.connect(noteData.gainNode);
            newOsc.start();
            noteData.oscillators[index] = newOsc;
            noteData.oscillatorGains[index] = newGain;
          } else if (osc && volume > 0) {
            osc.type = oscSettings.waveform;
            const rangeMultiplier = getRangeMultiplier(oscSettings.range);
            const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
            const newFrequency =
              baseFrequency * rangeMultiplier * frequencyOffset;
            osc.frequency.value = newFrequency;
            osc.detune.value = oscSettings.detune ?? 0;

            if (noteData.oscillatorGains[index]) {
              noteData.oscillatorGains[index].gain.value = volume;
            }
          }
        }
      });

      if (noteData.filterNode) {
        if (
          newSettings.filter?.cutoff !== undefined ||
          newSettings.filter?.resonance !== undefined ||
          newSettings.filter?.contourAmount !== undefined ||
          newSettings.filter?.type !== undefined
        ) {
          if (newSettings.filter?.cutoff !== undefined) {
            noteData.filterNode.frequency.value = newSettings.filter.cutoff;
          }
          if (newSettings.filter?.resonance !== undefined) {
            const baseQ = newSettings.filter.resonance * 30;
            if (newSettings.filter?.type === "notch") {
              noteData.filterNode.Q.value = baseQ * 2;
            } else if (newSettings.filter?.type === "bandpass") {
              noteData.filterNode.Q.value = baseQ * 1.5;
            } else {
              noteData.filterNode.Q.value = baseQ;
            }
          }
          if (newSettings.filter?.type !== undefined) {
            noteData.filterNode.type = newSettings.filter.type;
            // Update Q value when filter type changes
            const baseQ = state.settings.filter.resonance * 30;
            if (newSettings.filter.type === "notch") {
              noteData.filterNode.Q.value = baseQ * 2;
            } else if (newSettings.filter.type === "bandpass") {
              noteData.filterNode.Q.value = baseQ * 1.5;
            } else {
              noteData.filterNode.Q.value = baseQ;
            }
          }
          if (newSettings.filter?.contourAmount !== undefined) {
            noteData.filterModGain.gain.value =
              newSettings.filter.contourAmount;
          }
        }
      }

      if (noteData.lfo) {
        noteData.lfo.type = state.settings.lfo.waveform;
        noteData.lfo.frequency.value = state.settings.lfo.rate;
      }
    });

    if (
      newSettings.lfo?.waveform !== undefined ||
      newSettings.lfo?.rate !== undefined ||
      newSettings.lfo?.depth !== undefined ||
      newSettings.lfo?.routing !== undefined
    ) {
      // Update LFO settings for all active notes
      state.activeNotes.forEach((noteData) => {
        if (noteData.lfo) {
          if (newSettings.lfo?.waveform !== undefined) {
            noteData.lfo.type = newSettings.lfo.waveform;
          }
          if (newSettings.lfo?.rate !== undefined) {
            noteData.lfo.frequency.value = newSettings.lfo.rate;
          }
          if (newSettings.lfo?.routing !== undefined) {
            reconnectLFO(noteData, newSettings.lfo.routing);
          }
        }
      });

      // Update modulation amount for all active notes
      const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
      updateModulation(synthContext, state, modAmount);
    }

    if (newSettings.oscillators && Array.isArray(newSettings.oscillators)) {
      const oscillators = newSettings.oscillators;
      state.activeNotes.forEach((noteData) => {
        noteData.oscillators.forEach((osc, index) => {
          if (osc && index < oscillators.length) {
            const oscSettings = oscillators[index];
            if (
              oscSettings.pan !== undefined &&
              noteData.oscillatorPanners[index]
            ) {
              noteData.oscillatorPanners[index].pan.value = oscSettings.pan;
            }
          }
        });
      });
    }
  }

  function triggerAttack(note: Note): void {
    const now = synthContext.context.currentTime;
    console.log("Triggering attack for note:", note);

    state.noteStates.set(note, {
      isPlaying: true,
      isReleased: false,
      startTime: now,
      releaseTime: null,
    });

    const lastActiveNote = Array.from(state.activeNotes.keys())[0];
    const lastFrequency = lastActiveNote
      ? noteToFrequency(lastActiveNote, state.settings.tune)
      : null;

    // Clean up existing note if present
    if (state.activeNotes.has(note)) {
      const existingNote = state.activeNotes.get(note);
      if (existingNote) {
        console.log("Cleaning up existing note");
        const cleanupNode = (node: AudioNode | null, name: string) => {
          if (!node) return;
          try {
            if ("stop" in node && typeof node.stop === "function") {
              node.stop();
            }
            node.disconnect();
          } catch (e) {
            console.warn(`Error stopping ${name}:`, e);
          }
        };

        existingNote.oscillators.forEach((osc) =>
          cleanupNode(osc, "oscillator")
        );
        cleanupNode(existingNote.gainNode, "gain node");
        cleanupNode(existingNote.filterNode, "filter");
        cleanupNode(existingNote.lfo, "LFO");
        cleanupNode(existingNote.filterEnvelope, "filter envelope");
        cleanupNode(existingNote.filterModGain, "filter mod gain");

        state.activeNotes.delete(note);
      }
    }

    const hasActiveOscillators = state.settings.oscillators.some(
      (osc) => (osc.volume ?? 0) > 0
    );
    if (!hasActiveOscillators) {
      console.log("No active oscillators, skipping note creation");
      return;
    }

    const targetFrequency = noteToFrequency(note, state.settings.tune);
    console.log("Creating note with frequency:", targetFrequency);

    // Create main audio chain
    const noteGain = createGainNode(synthContext.context, 0);
    const filter = synthContext.context.createBiquadFilter();
    const baseCutoff = Math.min(
      Math.max(state.settings.filter.cutoff, 20),
      20000
    );
    filter.type = state.settings.filter.type;
    filter.frequency.value = baseCutoff;

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
    console.log("Created LFO:", {
      type: lfo.type,
      rate: lfo.frequency.value,
      depth: state.settings.lfo.depth,
      routing: state.settings.lfo.routing,
    });

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
    const oscillatorChains = state.settings.oscillators.map((oscSettings) => {
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
    });

    // Connect everything
    const filterGain = createGainNode(
      synthContext.context,
      state.settings.filter.type === "bandpass" ? 4 : 1
    );

    // Connect oscillators to note gain
    oscillatorChains.forEach(({ oscillator, gain, panner }) => {
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

    const filterEnvelope = createGainNode(synthContext.context, 0);
    const filterModGain = createGainNode(
      synthContext.context,
      state.settings.filter.contourAmount * baseCutoff * 0.15
    );

    noteGain.connect(filterEnvelope);
    filterEnvelope.connect(filterModGain);
    filterModGain.connect(filter.frequency);

    // Set up envelopes
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(
      1,
      now + state.settings.envelope.attack
    );
    noteGain.gain.linearRampToValueAtTime(
      state.settings.envelope.sustain,
      now + state.settings.envelope.attack + state.settings.envelope.decay
    );

    filterEnvelope.gain.setValueAtTime(0, now);
    filterEnvelope.gain.linearRampToValueAtTime(
      1,
      now + state.settings.envelope.attack
    );
    filterEnvelope.gain.linearRampToValueAtTime(
      state.settings.envelope.sustain,
      now + state.settings.envelope.attack + state.settings.envelope.decay
    );

    // Create the note data object
    const noteData: NoteData = {
      oscillators: oscillatorChains
        .map((chain) => chain.oscillator)
        .filter((osc): osc is OscillatorNode => osc !== null),
      oscillatorGains: oscillatorChains
        .map((chain) => chain.gain)
        .filter((gain): gain is GainNode => gain !== null),
      oscillatorPanners: oscillatorChains
        .map((chain) => chain.panner)
        .filter((panner): panner is StereoPannerNode => panner !== null),
      gainNode: noteGain,
      filterNode: filter,
      lfo,
      lfoGains,
      filterEnvelope,
      filterModGain,
      noiseNode,
      noiseGain,
      noisePanner,
      noiseFilter,
    };

    console.log("Created note data:", {
      hasOscillators: noteData.oscillators.length > 0,
      hasFilter: !!noteData.filterNode,
      hasLFO: !!noteData.lfo,
      lfoGains: Object.keys(noteData.lfoGains),
    });

    // Set up LFO connections
    reconnectLFO(noteData, state.settings.lfo.routing);

    // Store the note data
    state.activeNotes.set(note, noteData);

    // Apply initial modulation
    const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
    updateModulation(synthContext, state, modAmount);
  }

  function triggerRelease(note: Note): void {
    const noteData = state.activeNotes.get(note);
    const noteState = state.noteStates.get(note);

    if (!noteData || !noteState || noteState.isReleased) return;

    const now = synthContext.context.currentTime;
    noteState.isReleased = true;
    noteState.releaseTime = now;

    // Handle gain and filter envelope release
    const handleRelease = (node: GainNode, currentValue: number) => {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(currentValue, now);
      node.gain.exponentialRampToValueAtTime(
        0.001,
        now + state.settings.envelope.release
      );
    };

    handleRelease(noteData.gainNode, noteData.gainNode.gain.value);
    handleRelease(noteData.filterEnvelope, noteData.filterEnvelope.gain.value);

    // Disconnect LFO connections
    noteData.lfo.stop();
    Object.values(noteData.lfoGains).forEach((gain) => gain.disconnect());

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
      const currentState = state.noteStates.get(note);
      if (!currentState || !currentState.isReleased) return;

      if (state.activeNotes.has(note)) {
        // Cleanup oscillators
        noteData.oscillators.forEach((osc) =>
          disconnectNode(osc, "oscillator")
        );

        // Cleanup main nodes
        disconnectNode(noteData.gainNode, "gain node");
        disconnectNode(noteData.filterNode, "filter");
        disconnectNode(noteData.filterEnvelope, "filter envelope");
        disconnectNode(noteData.filterModGain, "filter mod gain");

        // Cleanup noise nodes
        disconnectNode(noteData.noiseNode, "noise node");
        disconnectNode(noteData.noiseGain, "noise gain");
        disconnectNode(noteData.noisePanner, "noise panner");

        state.activeNotes.delete(note);
        state.noteStates.delete(note);
      }
    }, state.settings.envelope.release * 1000);
  }

  function handleNoteTransition(fromNote: Note | null, toNote: Note): void {
    if (fromNote) {
      triggerRelease(fromNote);
    }
    triggerAttack(toNote);
  }

  function dispose(): void {
    state.activeNotes.forEach((_, note) => triggerRelease(note));
    state.noteStates.clear();
    synthContext.masterGain.disconnect();
    synthContext.context.close();
  }

  return {
    triggerAttack,
    triggerRelease,
    updateSettings,
    dispose,
    handleNoteTransition,
  };
}
