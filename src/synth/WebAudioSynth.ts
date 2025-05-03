import Tuna from "tunajs";

// Types
export type Note = string;
export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";
type NoteData = {
  oscillators: OscillatorNode[];
  oscillatorGains: GainNode[];
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  noiseNode?: AudioNode;
  noiseGain?: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  filterEnvelope: GainNode;
  filterModGain: GainNode;
};

export type OscillatorSettings = {
  type: OscillatorType;
  frequency: number;
  range: "32" | "16" | "8" | "4" | "2";
  volume: number;
  detune: number;
};

type NoiseGenerator = {
  node: AudioNode;
  start: () => void;
  stop: () => void;
  type: "white" | "pink";
};

export type SynthSettings = {
  tune: number;
  glide: number;
  modMix: number;
  oscillators: {
    type: OscillatorType;
    frequency: number;
    range: "32" | "16" | "8" | "4" | "2";
    volume: number;
    detune: number;
  }[];
  noise: {
    type: "white" | "pink";
    volume: number;
  };
  filter: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  lfo: {
    rate: number;
    depth: number;
  };
  reverb: {
    amount: number;
  };
  distortion: {
    outputGain: number;
  };
  delay: {
    amount: number;
  };
};

// Constants
const MASTER_VOLUME = 0.3;

// Note to frequency mapping
const NOTE_FREQUENCIES: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

// Pure functions
const noteToFrequency = (note: Note, tune: number = 0): number => {
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  const baseFrequency = NOTE_FREQUENCIES[noteName];
  return baseFrequency * Math.pow(2, octave - 4 + tune / 12);
};

const getRangeMultiplier = (range: string): number => {
  const rangeMap: Record<string, number> = {
    "32": 0.125,
    "16": 0.25,
    "8": 0.5,
    "4": 1,
    "2": 2,
  };
  return rangeMap[range] || 1;
};

const createOscillator = (
  context: AudioContext,
  settings: OscillatorSettings,
  baseFrequency: number
): OscillatorNode => {
  const oscillator = context.createOscillator();
  oscillator.type = settings.type;
  const rangeMultiplier = getRangeMultiplier(settings.range);
  const frequencyOffset = Math.pow(2, settings.frequency / 12);
  const finalFrequency = baseFrequency * rangeMultiplier * frequencyOffset;
  oscillator.frequency.value = finalFrequency;
  oscillator.detune.value = settings.detune;
  return oscillator;
};

const createNoiseGenerator = (
  context: AudioContext,
  type: "white" | "pink"
): NoiseGenerator => {
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
  } else {
    // Pink noise implementation using AudioWorklet
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
};

const createGainNode = (context: AudioContext, volume: number): GainNode => {
  const gainNode = context.createGain();
  gainNode.gain.value = volume;
  return gainNode;
};

// Add these types at the top with other types
type NoteState = {
  isPlaying: boolean;
  isReleased: boolean;
  startTime: number;
  releaseTime: number | null;
};

// Factory function to create a synth
export const createSynth = async () => {
  const context = new AudioContext();

  // Load the pink noise worklet
  await context.audioWorklet.addModule("pink-noise-processor.js");

  const masterGain = createGainNode(context, MASTER_VOLUME);

  // Create delay nodes
  const delayNode = context.createDelay(1.0); // Max 1 second delay
  delayNode.delayTime.value = 0.3; // Fixed 300ms delay
  const delayGain = context.createGain();
  delayGain.gain.value = 0; // Start with no delay
  const delayFeedback = context.createGain();
  delayFeedback.gain.value = 0.6; // Increased feedback to 60%

  // Create reverb nodes
  const reverbNode = context.createConvolver();
  const reverbGain = context.createGain();
  reverbGain.gain.value = 0;

  // Create impulse response for reverb with fixed time
  const sampleRate = context.sampleRate;
  const length = sampleRate * 1.5; // Fixed 1.5 second reverb
  const impulse = context.createBuffer(2, length, sampleRate);
  const leftChannel = impulse.getChannelData(0);
  const rightChannel = impulse.getChannelData(1);

  // Generate impulse response
  for (let i = 0; i < length; i++) {
    const decay = Math.exp((-3 * i) / length);
    leftChannel[i] = (Math.random() * 2 - 1) * decay;
    rightChannel[i] = (Math.random() * 2 - 1) * decay;
  }

  reverbNode.buffer = impulse;

  // Create distortion node using the same context
  const tuna = new Tuna(context);
  const distortion = new tuna.Overdrive({
    outputGain: 0.5,
    drive: 0.7,
    curveAmount: 1,
    algorithmIndex: 0,
    bypass: 0,
  });

  // Create compressor to prevent distortion from getting too loud
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24; // Start limiting at -24dB
  compressor.knee.value = 12; // Smooth transition into limiting
  compressor.ratio.value = 12; // Strong limiting
  compressor.attack.value = 0.003; // Fast attack
  compressor.release.value = 0.25; // Quick release

  // Create gain nodes for wet/dry mix
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  dryGain.gain.value = 1; // Start with full dry signal
  wetGain.gain.value = 0; // Start with no wet signal

  // Connect nodes in the correct order
  masterGain.connect(dryGain);
  masterGain.connect(distortion);
  distortion.connect(compressor);
  compressor.connect(wetGain);

  // Connect delay
  masterGain.connect(delayNode);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode); // Feedback loop
  delayNode.connect(delayGain);

  // Mix the dry and wet signals
  dryGain.connect(reverbNode);
  wetGain.connect(reverbNode);
  delayGain.connect(reverbNode);

  reverbNode.connect(reverbGain);
  reverbGain.connect(context.destination);

  // Also connect dry and wet directly to output
  dryGain.connect(context.destination);
  wetGain.connect(context.destination);
  delayGain.connect(context.destination);

  const activeNotes = new Map<Note, NoteData>();
  let lastFrequency = 440; // Default to A4

  // Add this after the activeNotes declaration
  const noteStates = new Map<Note, NoteState>();

  // Synth settings
  let settings: SynthSettings = {
    tune: 0,
    glide: 0,
    modMix: 0,
    oscillators: [
      {
        type: "triangle" as OscillatorType,
        frequency: 0,
        range: "8",
        volume: 0.7,
        detune: 0,
      },
      {
        type: "triangle" as OscillatorType,
        frequency: 0,
        range: "8",
        volume: 0.7,
        detune: 0,
      },
      {
        type: "triangle" as OscillatorType,
        frequency: 0,
        range: "8",
        volume: 0.7,
        detune: 0,
      },
    ],
    noise: {
      type: "white" as "white" | "pink",
      volume: 0,
    },
    filter: {
      cutoff: 2000,
      resonance: 0,
      contourAmount: 0,
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
  };

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    settings = { ...settings, ...newSettings };

    // Update distortion settings
    if (newSettings.distortion) {
      if (newSettings.distortion.outputGain !== undefined) {
        const mix = newSettings.distortion.outputGain / 100;
        // Convert linear mix to logarithmic scale
        // This gives more precise control in the lower ranges
        const logMix = Math.pow(mix, 2); // Square the mix value for a gentle curve
        dryGain.gain.value = 1 - logMix;
        wetGain.gain.value = logMix;
      }
    }

    // Update reverb settings
    if (newSettings.reverb) {
      reverbGain.gain.value = newSettings.reverb.amount / 100;
    }

    // Update delay settings
    if (newSettings.delay) {
      delayGain.gain.value = newSettings.delay.amount / 100;
    }

    // Update active notes with new settings
    activeNotes.forEach((noteData, note) => {
      const baseFrequency = noteToFrequency(note, settings.tune);

      // Update oscillator settings
      noteData.oscillators.forEach((osc, index) => {
        if (index < settings.oscillators.length) {
          const oscSettings = settings.oscillators[index];

          // If volume is 0 and oscillator exists, disconnect and remove it
          if (oscSettings.volume === 0 && osc) {
            osc.stop();
            osc.disconnect();
            if (noteData.oscillatorGains[index]) {
              noteData.oscillatorGains[index].disconnect();
            }
            noteData.oscillators[index] = null as unknown as OscillatorNode;
            noteData.oscillatorGains[index] = null as unknown as GainNode;
          }
          // If volume is > 0 and oscillator doesn't exist, create it
          else if (oscSettings.volume > 0 && !osc) {
            const newOsc = createOscillator(
              context,
              oscSettings,
              baseFrequency
            );
            const newGain = createGainNode(context, oscSettings.volume);
            newOsc.connect(newGain);
            newGain.connect(noteData.gainNode);
            newOsc.start();
            noteData.oscillators[index] = newOsc;
            noteData.oscillatorGains[index] = newGain;
          }
          // If oscillator exists and volume > 0, update its settings
          else if (osc && oscSettings.volume > 0) {
            osc.type = oscSettings.type;

            // Calculate new frequency based on base note, range, and frequency offset
            const rangeMultiplier = getRangeMultiplier(oscSettings.range);
            const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
            const newFrequency =
              baseFrequency * rangeMultiplier * frequencyOffset;

            // Apply the new frequency immediately
            osc.frequency.value = newFrequency;
            osc.detune.value = oscSettings.detune;

            // Update the gain node for this oscillator
            if (noteData.oscillatorGains[index]) {
              noteData.oscillatorGains[index].gain.value = oscSettings.volume;
            }
          }
        }
      });

      // Update filter
      if (noteData.filterNode) {
        noteData.filterNode.frequency.value = settings.filter.cutoff;
        noteData.filterNode.Q.value = settings.filter.resonance * 30;
      }

      // Update noise settings
      if (settings.noise.volume > 0) {
        if (!noteData.noiseNode) {
          const noise = createNoiseGenerator(context, settings.noise.type);
          const noiseGain = createGainNode(context, settings.noise.volume);
          noise.node.connect(noiseGain);
          noiseGain.connect(noteData.gainNode);
          noise.start();
          noteData.noiseNode = noise.node;
          noteData.noiseGain = noiseGain;
        } else if (noteData.noiseGain) {
          noteData.noiseGain.gain.value = settings.noise.volume;
        }
      } else if (noteData.noiseNode) {
        noteData.noiseNode.disconnect();
        if (noteData.noiseGain) {
          noteData.noiseGain.disconnect();
        }
        noteData.noiseNode = undefined;
        noteData.noiseGain = undefined;
      }
    });
  };

  const triggerAttack = (note: Note) => {
    const now = context.currentTime;

    // Update note state
    noteStates.set(note, {
      isPlaying: true,
      isReleased: false,
      startTime: now,
      releaseTime: null,
    });

    // Force cleanup of any existing note
    if (activeNotes.has(note)) {
      const existingNote = activeNotes.get(note);
      if (existingNote) {
        // Force immediate stop of all oscillators
        existingNote.oscillators.forEach((osc) => {
          if (osc) {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              console.warn("Error stopping oscillator:", e);
            }
          }
        });

        // Force immediate stop of all gain nodes
        try {
          existingNote.gainNode.gain.cancelScheduledValues(now);
          existingNote.gainNode.gain.setValueAtTime(0, now);
          existingNote.gainNode.disconnect();
        } catch (e) {
          console.warn("Error stopping gain node:", e);
        }

        // Force immediate stop of filter
        try {
          existingNote.filterNode.disconnect();
        } catch (e) {
          console.warn("Error stopping filter:", e);
        }

        // Force immediate stop of noise
        if (existingNote.noiseNode) {
          try {
            existingNote.noiseNode.disconnect();
          } catch (e) {
            console.warn("Error stopping noise:", e);
          }
        }
        if (existingNote.noiseGain) {
          try {
            existingNote.noiseGain.disconnect();
          } catch (e) {
            console.warn("Error stopping noise gain:", e);
          }
        }

        // Force immediate stop of LFO
        try {
          existingNote.lfo.stop();
          existingNote.lfoGain.disconnect();
        } catch (e) {
          console.warn("Error stopping LFO:", e);
        }

        // Force immediate stop of filter envelope
        try {
          existingNote.filterEnvelope.disconnect();
          existingNote.filterModGain.disconnect();
        } catch (e) {
          console.warn("Error stopping filter envelope:", e);
        }

        activeNotes.delete(note);
      }
    }

    // Check if any oscillator has non-zero volume
    const hasActiveOscillators = settings.oscillators.some(
      (osc) => osc.volume > 0
    );
    if (!hasActiveOscillators) return;

    const targetFrequency = noteToFrequency(note, settings.tune);
    const noteGain = createGainNode(context, 0);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";

    // Scale the cutoff frequency to be more musical (20Hz to 20kHz)
    const baseCutoff = Math.min(Math.max(settings.filter.cutoff, 20), 20000);
    filter.frequency.value = baseCutoff;
    filter.Q.value = settings.filter.resonance * 30;

    // Add LFO
    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = settings.lfo.rate;
    const lfoGain = createGainNode(
      context,
      settings.lfo.depth * baseCutoff * 0.5
    );
    lfo.connect(lfoGain);

    if (settings.modMix > 0) {
      lfoGain.connect(filter.frequency);
    }
    lfo.start();

    // Add contour modulation
    const filterEnvelope = createGainNode(context, 0);
    const filterModGain = createGainNode(
      context,
      settings.filter.contourAmount * baseCutoff * 0.3
    );

    noteGain.connect(filterEnvelope);
    filterEnvelope.connect(filterModGain);
    filterModGain.connect(filter.frequency);

    const modGain = createGainNode(context, settings.modMix);
    noteGain.connect(modGain);
    modGain.connect(filter);

    const oscillators: OscillatorNode[] = [];
    const oscillatorGains: GainNode[] = [];

    const startTime = now;

    settings.oscillators.forEach((oscSettings) => {
      if (oscSettings.volume > 0) {
        const osc = createOscillator(context, oscSettings, targetFrequency);
        const gainNode = createGainNode(context, oscSettings.volume);
        osc.connect(gainNode);
        gainNode.connect(noteGain);
        osc.start(startTime);

        if (settings.glide > 0) {
          const glideTime = settings.glide * 0.5;
          const rangeMultiplier = getRangeMultiplier(oscSettings.range);
          const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
          const fromFrequency =
            lastFrequency * rangeMultiplier * frequencyOffset;
          const toFrequency =
            targetFrequency * rangeMultiplier * frequencyOffset;
          osc.frequency.setValueAtTime(fromFrequency, startTime);
          osc.frequency.linearRampToValueAtTime(
            toFrequency,
            startTime + glideTime
          );
        }

        oscillators.push(osc);
        oscillatorGains.push(gainNode);
      } else {
        oscillators.push(null as unknown as OscillatorNode);
        oscillatorGains.push(null as unknown as GainNode);
      }
    });

    let noiseNode: AudioNode | undefined;
    let noiseGain: GainNode | undefined;
    if (settings.noise.volume > 0) {
      const noise = createNoiseGenerator(context, settings.noise.type);
      noiseGain = createGainNode(context, settings.noise.volume);
      noiseNode = noise.node;
      noiseNode.connect(noiseGain);
      noiseGain.connect(noteGain);
      noise.start();
    }

    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(
      1,
      startTime + settings.envelope.attack
    );
    noteGain.gain.linearRampToValueAtTime(
      settings.envelope.sustain,
      startTime + settings.envelope.attack + settings.envelope.decay
    );

    filterEnvelope.gain.setValueAtTime(0, startTime);
    filterEnvelope.gain.linearRampToValueAtTime(
      1,
      startTime + settings.envelope.attack
    );
    filterEnvelope.gain.linearRampToValueAtTime(
      settings.envelope.sustain,
      startTime + settings.envelope.attack + settings.envelope.decay
    );

    lastFrequency = targetFrequency;

    noteGain.connect(filter);
    filter.connect(masterGain);

    activeNotes.set(note, {
      oscillators,
      oscillatorGains,
      gainNode: noteGain,
      filterNode: filter,
      noiseNode,
      noiseGain,
      lfo,
      lfoGain,
      filterEnvelope,
      filterModGain,
    });
  };

  const triggerRelease = (note: Note) => {
    const noteData = activeNotes.get(note);
    const noteState = noteStates.get(note);

    if (!noteData || !noteState || noteState.isReleased) return;

    const now = context.currentTime;
    noteState.isReleased = true;
    noteState.releaseTime = now;

    // Cancel all scheduled values
    noteData.gainNode.gain.cancelScheduledValues(now);
    noteData.filterEnvelope.gain.cancelScheduledValues(now);

    // Get current values
    const currentGain = noteData.gainNode.gain.value;
    const currentFilterGain = noteData.filterEnvelope.gain.value;

    // Immediate release
    noteData.gainNode.gain.setValueAtTime(currentGain, now);
    noteData.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    noteData.filterEnvelope.gain.setValueAtTime(currentFilterGain, now);
    noteData.filterEnvelope.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.01
    );

    // Stop LFO immediately
    noteData.lfo.stop();
    noteData.lfoGain.disconnect();

    // Schedule immediate cleanup
    setTimeout(() => {
      const currentState = noteStates.get(note);
      if (!currentState || !currentState.isReleased) return;

      if (activeNotes.has(note)) {
        // Force stop all oscillators
        noteData.oscillators.forEach((osc) => {
          if (osc) {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              console.warn("Error stopping oscillator:", e);
            }
          }
        });

        // Force stop all gain nodes
        try {
          noteData.gainNode.disconnect();
        } catch (e) {
          console.warn("Error stopping gain node:", e);
        }

        // Force stop filter
        try {
          noteData.filterNode.disconnect();
        } catch (e) {
          console.warn("Error stopping filter:", e);
        }

        // Force stop noise
        if (noteData.noiseNode) {
          try {
            noteData.noiseNode.disconnect();
          } catch (e) {
            console.warn("Error stopping noise:", e);
          }
        }
        if (noteData.noiseGain) {
          try {
            noteData.noiseGain.disconnect();
          } catch (e) {
            console.warn("Error stopping noise gain:", e);
          }
        }

        // Force stop filter envelope
        try {
          noteData.filterEnvelope.disconnect();
          noteData.filterModGain.disconnect();
        } catch (e) {
          console.warn("Error stopping filter envelope:", e);
        }

        activeNotes.delete(note);
        noteStates.delete(note);
      }
    }, 20);
  };

  // Add a function to handle note transitions with glide
  const handleNoteTransition = (fromNote: Note | null, toNote: Note) => {
    const toFrequency = noteToFrequency(toNote, settings.tune);
    const now = context.currentTime;
    const glideTime = settings.glide * 0.5; // Scale glide time (0-1 to 0-0.5 seconds)

    if (fromNote && settings.glide > 0) {
      // If there's a previous note and glide is enabled, smoothly transition frequencies
      const fromNoteData = activeNotes.get(fromNote);
      if (fromNoteData) {
        fromNoteData.oscillators.forEach((osc, index) => {
          if (index < settings.oscillators.length && osc) {
            const fromFreq = osc.frequency.value;
            osc.frequency.setValueAtTime(fromFreq, now);
            osc.frequency.linearRampToValueAtTime(toFrequency, now + glideTime);
          }
        });
      }
    }

    // Trigger the new note
    triggerAttack(toNote);
  };

  const dispose = () => {
    activeNotes.forEach((_, note) => triggerRelease(note));
    noteStates.clear();
    masterGain.disconnect();
    context.close();
  };

  return {
    triggerAttack,
    triggerRelease,
    updateSettings,
    dispose,
    handleNoteTransition,
  };
};

// Remove the synchronous usage since createSynth is async
// const synth = createSynth();
// synth.triggerAttack("C4");
// synth.triggerRelease("C4");
// // When done
// synth.dispose();
