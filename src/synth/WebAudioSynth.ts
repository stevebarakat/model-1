import { Note, NoteData, NoteState, SynthSettings } from "./types";
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

function createSynthContext(): SynthContext {
  const context = new AudioContext();
  const { masterGain, delayGain, reverbGain, dryGain, wetGain } =
    setupEffects(context);
  const noiseGain = context.createGain();
  const noisePanner = context.createStereoPanner();
  noiseGain.connect(noisePanner);
  noisePanner.connect(masterGain);
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
        tone: 50,
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

function updateModulation(
  synthContext: SynthContext,
  state: SynthState,
  modAmount: number
): void {
  state.activeNotes.forEach((noteData) => {
    if (noteData.lfo) {
      const baseCutoff = Math.min(
        Math.max(state.settings.filter.cutoff, 20),
        20000
      );

      if (modAmount === 0) {
        disconnectLFO(noteData);
      } else {
        reconnectLFO(noteData, state.settings.lfo.routing);
      }

      updateLFOGains(
        noteData,
        modAmount,
        state.settings.lfo.depth,
        baseCutoff,
        synthContext.context.currentTime
      );
    }
  });
}

function disconnectLFO(noteData: NoteData): void {
  noteData.lfoGains.filterCutoff.disconnect();
  noteData.lfoGains.filterResonance.disconnect();
  noteData.lfoGains.oscillatorPitch.disconnect();
  noteData.lfoGains.oscillatorVolume.disconnect();
}

function reconnectLFO(
  noteData: NoteData,
  routing: {
    filterCutoff: boolean;
    filterResonance: boolean;
    oscillatorPitch: boolean;
    oscillatorVolume: boolean;
  }
): void {
  if (routing.filterCutoff) {
    noteData.lfoGains.filterCutoff.connect(noteData.filterNode.frequency);
  }
  if (routing.filterResonance) {
    noteData.lfoGains.filterResonance.connect(noteData.filterNode.Q);
  }
  if (routing.oscillatorPitch) {
    noteData.oscillators.forEach((osc) => {
      if (osc) {
        noteData.lfoGains.oscillatorPitch.connect(osc.detune);
      }
    });
  }
  if (routing.oscillatorVolume) {
    noteData.oscillatorGains.forEach((gain) => {
      if (gain) {
        noteData.lfoGains.oscillatorVolume.connect(gain.gain);
      }
    });
  }
}

function updateLFOGains(
  noteData: NoteData,
  modAmount: number,
  lfoDepth: number,
  baseCutoff: number,
  currentTime: number
): void {
  const smoothingTime = 0.01;

  noteData.lfoGains.filterCutoff.gain.setTargetAtTime(
    modAmount * lfoDepth * baseCutoff,
    currentTime,
    smoothingTime
  );
  noteData.lfoGains.filterResonance.gain.setTargetAtTime(
    modAmount * lfoDepth * 30,
    currentTime,
    smoothingTime
  );
  noteData.lfoGains.oscillatorPitch.gain.setTargetAtTime(
    modAmount * lfoDepth * 100,
    currentTime,
    smoothingTime
  );
  noteData.lfoGains.oscillatorVolume.gain.setTargetAtTime(
    modAmount * lfoDepth,
    currentTime,
    smoothingTime
  );
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
            // Map tone (0-4) to frequency ranges
            const baseFreq =
              state.settings.noise.tone === 0
                ? 200
                : state.settings.noise.tone === 1
                ? 800
                : state.settings.noise.tone === 2
                ? 2000
                : state.settings.noise.tone === 3
                ? 5000
                : 20000;
            const noteFreq = noteToFrequency(note, state.settings.tune);
            const freq = state.settings.noise.sync
              ? noteFreq * (baseFreq / 440)
              : baseFreq;
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
      state.activeNotes.forEach((noteData) => {
        if (noteData.lfo) {
          if (newSettings.lfo?.waveform !== undefined) {
            noteData.lfo.type = newSettings.lfo.waveform;
          }
          if (newSettings.lfo?.rate !== undefined) {
            noteData.lfo.frequency.value = newSettings.lfo.rate;
          }
          if (newSettings.lfo?.depth !== undefined) {
            const baseCutoff = Math.min(
              Math.max(state.settings.filter.cutoff, 20),
              20000
            );
            const currentTime = synthContext.context.currentTime;
            const smoothingTime = 0.01; // 10ms smoothing
            noteData.lfoGains.filterCutoff.gain.setTargetAtTime(
              newSettings.lfo.depth * baseCutoff,
              currentTime,
              smoothingTime
            );
            noteData.lfoGains.filterResonance.gain.setTargetAtTime(
              newSettings.lfo.depth * 30,
              currentTime,
              smoothingTime
            );
            noteData.lfoGains.oscillatorPitch.gain.setTargetAtTime(
              newSettings.lfo.depth * 100,
              currentTime,
              smoothingTime
            );
            noteData.lfoGains.oscillatorVolume.gain.setTargetAtTime(
              newSettings.lfo.depth,
              currentTime,
              smoothingTime
            );
          }
          if (newSettings.lfo?.routing !== undefined) {
            // Disconnect all LFO connections
            noteData.lfoGains.filterCutoff.disconnect();
            noteData.lfoGains.filterResonance.disconnect();
            noteData.lfoGains.oscillatorPitch.disconnect();
            noteData.lfoGains.oscillatorVolume.disconnect();

            // Reconnect based on new routing settings
            if (newSettings.lfo.routing.filterCutoff) {
              noteData.lfoGains.filterCutoff.connect(
                noteData.filterNode.frequency
              );
            }
            if (newSettings.lfo.routing.filterResonance) {
              noteData.lfoGains.filterResonance.connect(noteData.filterNode.Q);
            }
            if (newSettings.lfo.routing.oscillatorPitch) {
              noteData.oscillators.forEach((osc) => {
                if (osc) {
                  noteData.lfoGains.oscillatorPitch.connect(osc.detune);
                }
              });
            }
            if (newSettings.lfo.routing.oscillatorVolume) {
              noteData.oscillatorGains.forEach((gain) => {
                if (gain) {
                  noteData.lfoGains.oscillatorVolume.connect(gain.gain);
                }
              });
            }
          }
        }
      });
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

    state.noteStates.set(note, {
      isPlaying: true,
      isReleased: false,
      startTime: now,
      releaseTime: null,
    });

    // Find the last active note for glide before cleaning up
    const lastActiveNote = Array.from(state.activeNotes.keys())[0];
    const lastFrequency = lastActiveNote
      ? noteToFrequency(lastActiveNote, state.settings.tune)
      : null;

    if (state.activeNotes.has(note)) {
      const existingNote = state.activeNotes.get(note);
      if (existingNote) {
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

        try {
          existingNote.gainNode.gain.cancelScheduledValues(now);
          existingNote.gainNode.gain.setValueAtTime(0, now);
          existingNote.gainNode.disconnect();
        } catch (e) {
          console.warn("Error stopping gain node:", e);
        }

        try {
          existingNote.filterNode.disconnect();
        } catch (e) {
          console.warn("Error stopping filter:", e);
        }

        try {
          existingNote.lfo.stop();
          existingNote.lfoGains.filterCutoff.disconnect();
          existingNote.lfoGains.filterResonance.disconnect();
          existingNote.lfoGains.oscillatorPitch.disconnect();
          existingNote.lfoGains.oscillatorVolume.disconnect();
        } catch (e) {
          console.warn("Error stopping LFO:", e);
        }

        try {
          existingNote.filterEnvelope.disconnect();
          existingNote.filterModGain.disconnect();
        } catch (e) {
          console.warn("Error stopping filter envelope:", e);
        }

        state.activeNotes.delete(note);
      }
    }

    const hasActiveOscillators = state.settings.oscillators.some(
      (osc) => (osc.volume ?? 0) > 0
    );
    if (!hasActiveOscillators) return;

    const targetFrequency = noteToFrequency(note, state.settings.tune);
    const noteGain = createGainNode(synthContext.context, 0);
    const filter = synthContext.context.createBiquadFilter();
    const baseCutoff = Math.min(
      Math.max(state.settings.filter.cutoff, 20),
      20000
    );
    filter.type = state.settings.filter.type;
    filter.frequency.value = baseCutoff;

    // Create noise node if noise is enabled
    let noiseNode: AudioWorkletNode | null = null;
    let noiseFilter: BiquadFilterNode | null = null;
    if (state.settings.noise.volume > 0) {
      try {
        const processorName =
          state.settings.noise.type === "pink"
            ? "pink-noise-processor"
            : "white-noise-processor";
        noiseNode = new AudioWorkletNode(synthContext.context, processorName);
        const noiseGain = createGainNode(
          synthContext.context,
          state.settings.noise.volume
        );
        const noisePanner = synthContext.context.createStereoPanner();
        noisePanner.pan.value = state.settings.noise.pan;

        // Create noise filter
        noiseFilter = synthContext.context.createBiquadFilter();
        noiseFilter.type = "lowpass";
        // Map tone (0-4) to frequency ranges
        const baseFreq =
          state.settings.noise.tone === 0
            ? 200
            : state.settings.noise.tone === 1
            ? 800
            : state.settings.noise.tone === 2
            ? 2000
            : state.settings.noise.tone === 3
            ? 5000
            : 20000;
        const noteFreq = targetFrequency;
        const freq = state.settings.noise.sync
          ? noteFreq * (baseFreq / 440)
          : baseFreq;
        noiseFilter.frequency.value = freq;
        noiseFilter.Q.value = 1;

        noiseNode.connect(noiseGain);
        noiseGain.connect(noiseFilter);
        noiseFilter.connect(noisePanner);
        noisePanner.connect(noteGain);
      } catch (error) {
        console.error("Failed to create noise node:", error);
      }
    }

    // Adjust Q value based on filter type
    const baseQ = state.settings.filter.resonance * 30;
    if (state.settings.filter.type === "notch") {
      // Make notch filter more pronounced
      filter.Q.value = baseQ * 2;
    } else if (state.settings.filter.type === "bandpass") {
      // Make bandpass filter more focused
      filter.Q.value = baseQ * 1.5;
    } else {
      filter.Q.value = baseQ;
    }

    // Add gain boost for bandpass filter
    const filterGain = createGainNode(
      synthContext.context,
      state.settings.filter.type === "bandpass" ? 4 : 1
    );
    filter.connect(filterGain);
    filterGain.connect(synthContext.masterGain);

    // Create LFO
    const lfo = synthContext.context.createOscillator();
    lfo.type = state.settings.lfo.waveform;
    lfo.frequency.value = state.settings.lfo.rate;

    // Create LFO gains for each routing destination
    const lfoGains = {
      filterCutoff: createGainNode(synthContext.context, 0),
      filterResonance: createGainNode(synthContext.context, 0),
      oscillatorPitch: createGainNode(synthContext.context, 0),
      oscillatorVolume: createGainNode(synthContext.context, 0),
    };

    // Connect LFO to each gain node
    lfo.connect(lfoGains.filterCutoff);
    lfo.connect(lfoGains.filterResonance);
    lfo.connect(lfoGains.oscillatorPitch);
    lfo.connect(lfoGains.oscillatorVolume);

    // Connect each gain to its destination based on routing settings
    if (state.settings.lfo.routing.filterCutoff) {
      lfoGains.filterCutoff.connect(filter.frequency);
    }
    if (state.settings.lfo.routing.filterResonance) {
      lfoGains.filterResonance.connect(filter.Q);
    }

    lfo.start();

    // Update LFO gains based on mod wheel and mod mix
    const modAmount = (state.settings.modWheel / 100) * state.settings.modMix;
    const currentTime = synthContext.context.currentTime;
    const smoothingTime = 0.01; // 10ms smoothing

    lfoGains.filterCutoff.gain.setTargetAtTime(
      modAmount * state.settings.lfo.depth * baseCutoff,
      currentTime,
      smoothingTime
    );
    lfoGains.filterResonance.gain.setTargetAtTime(
      modAmount * state.settings.lfo.depth * 30,
      currentTime,
      smoothingTime
    );
    lfoGains.oscillatorPitch.gain.setTargetAtTime(
      modAmount * state.settings.lfo.depth * 100,
      currentTime,
      smoothingTime
    );
    lfoGains.oscillatorVolume.gain.setTargetAtTime(
      modAmount * state.settings.lfo.depth,
      currentTime,
      smoothingTime
    );

    const filterEnvelope = createGainNode(synthContext.context, 0);
    const filterModGain = createGainNode(
      synthContext.context,
      state.settings.filter.contourAmount * baseCutoff * 0.15
    );

    noteGain.connect(filterEnvelope);
    filterEnvelope.connect(filterModGain);
    filterModGain.connect(filter.frequency);

    // Connect the main signal chain
    noteGain.connect(filter);
    filter.connect(synthContext.masterGain);

    const oscillators: OscillatorNode[] = [];
    const oscillatorGains: GainNode[] = [];
    const oscillatorPanners: StereoPannerNode[] = [];

    const startTime = now;

    state.settings.oscillators.forEach((oscSettings) => {
      const volume = oscSettings.volume ?? 0;
      if (volume > 0) {
        // Calculate the starting frequency based on glide
        const rangeMultiplier = getRangeMultiplier(oscSettings.range);
        const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
        const finalFrequency =
          targetFrequency * rangeMultiplier * frequencyOffset;

        // If glide is enabled and we have a previous note, start from its frequency
        const startFrequency =
          state.settings.glide > 0 && lastFrequency
            ? lastFrequency * rangeMultiplier * frequencyOffset
            : finalFrequency;

        const osc = createOscillator(
          synthContext.context,
          {
            ...oscSettings,
            type: oscSettings.waveform,
          },
          startFrequency
        );

        const gainNode = createGainNode(synthContext.context, volume);
        const panner = synthContext.context.createStereoPanner();
        panner.pan.value = oscSettings.pan ?? 0;

        osc.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(noteGain);
        osc.start(startTime);

        // Apply glide if enabled
        if (state.settings.glide > 0 && lastFrequency) {
          const glideTime = state.settings.glide * 0.5; // Scale glide time (0-1 to 0-0.5 seconds)
          osc.frequency.linearRampToValueAtTime(
            finalFrequency,
            startTime + glideTime
          );
        }

        // Connect LFO to oscillator if routing is enabled
        if (state.settings.lfo.routing.oscillatorPitch) {
          lfoGains.oscillatorPitch.connect(osc.detune);
        }
        if (state.settings.lfo.routing.oscillatorVolume) {
          lfoGains.oscillatorVolume.connect(gainNode.gain);
        }

        oscillators.push(osc);
        oscillatorGains.push(gainNode);
        oscillatorPanners.push(panner);
      } else {
        oscillators.push(null as unknown as OscillatorNode);
        oscillatorGains.push(null as unknown as GainNode);
        oscillatorPanners.push(null as unknown as StereoPannerNode);
      }
    });

    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(
      1,
      startTime + state.settings.envelope.attack
    );
    noteGain.gain.linearRampToValueAtTime(
      state.settings.envelope.sustain,
      startTime + state.settings.envelope.attack + state.settings.envelope.decay
    );

    filterEnvelope.gain.setValueAtTime(0, startTime);
    filterEnvelope.gain.linearRampToValueAtTime(
      1,
      startTime + state.settings.envelope.attack
    );
    filterEnvelope.gain.linearRampToValueAtTime(
      state.settings.envelope.sustain,
      startTime + state.settings.envelope.attack + state.settings.envelope.decay
    );

    noteGain.connect(filter);
    filter.connect(synthContext.masterGain);

    state.activeNotes.set(note, {
      oscillators,
      oscillatorGains,
      oscillatorPanners,
      gainNode: noteGain,
      filterNode: filter,
      lfo,
      lfoGains,
      filterEnvelope,
      filterModGain,
      noiseNode,
      noiseGain: noiseNode
        ? createGainNode(synthContext.context, state.settings.noise.volume)
        : null,
      noisePanner: noiseNode ? synthContext.context.createStereoPanner() : null,
      noiseFilter,
    });
  }

  function triggerRelease(note: Note): void {
    const noteData = state.activeNotes.get(note);
    const noteState = state.noteStates.get(note);

    if (!noteData || !noteState || noteState.isReleased) return;

    const now = synthContext.context.currentTime;
    noteState.isReleased = true;
    noteState.releaseTime = now;

    noteData.gainNode.gain.cancelScheduledValues(now);
    noteData.filterEnvelope.gain.cancelScheduledValues(now);

    const currentGain = noteData.gainNode.gain.value;
    const currentFilterGain = noteData.filterEnvelope.gain.value;

    noteData.gainNode.gain.setValueAtTime(currentGain, now);
    noteData.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + state.settings.envelope.release
    );

    noteData.filterEnvelope.gain.setValueAtTime(currentFilterGain, now);
    noteData.filterEnvelope.gain.exponentialRampToValueAtTime(
      0.001,
      now + state.settings.envelope.release
    );

    noteData.lfo.stop();
    noteData.lfoGains.filterCutoff.disconnect();
    noteData.lfoGains.filterResonance.disconnect();
    noteData.lfoGains.oscillatorPitch.disconnect();
    noteData.lfoGains.oscillatorVolume.disconnect();

    setTimeout(() => {
      const currentState = state.noteStates.get(note);
      if (!currentState || !currentState.isReleased) return;

      if (state.activeNotes.has(note)) {
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

        try {
          noteData.gainNode.disconnect();
        } catch (e) {
          console.warn("Error stopping gain node:", e);
        }

        try {
          noteData.filterNode.disconnect();
        } catch (e) {
          console.warn("Error stopping filter:", e);
        }

        try {
          noteData.filterEnvelope.disconnect();
          noteData.filterModGain.disconnect();
        } catch (e) {
          console.warn("Error stopping filter envelope:", e);
        }

        // Clean up noise nodes
        if (noteData.noiseNode) {
          try {
            noteData.noiseNode.disconnect();
            if (noteData.noiseGain) noteData.noiseGain.disconnect();
            if (noteData.noisePanner) noteData.noisePanner.disconnect();
          } catch (e) {
            console.warn("Error stopping noise nodes:", e);
          }
        }

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

// Remove the synchronous usage since createSynth is async
// const synth = createSynth();
// synth.triggerAttack("C4");
// synth.triggerRelease("C4");
// // When done
// synth.dispose();
