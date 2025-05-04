import { Note, NoteData, NoteState, SynthSettings } from "./types";
import { noteToFrequency, getRangeMultiplier } from "./utils/frequency";
import {
  createOscillator,
  createNoiseGenerator,
  createGainNode,
} from "./audio/nodes";
import { setupEffects } from "./audio/effects";

// Factory function to create a synth
export async function createSynth() {
  const context = new AudioContext();
  await context.audioWorklet.addModule("pink-noise-processor.js");

  const { masterGain, delayGain, reverbGain, dryGain, wetGain } =
    setupEffects(context);

  const activeNotes = new Map<Note, NoteData>();
  const noteStates = new Map<Note, NoteState>();

  let settings: SynthSettings = {
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
      type: "white",
      volume: 0,
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
  };

  function updateSettings(newSettings: Partial<typeof settings>) {
    settings = { ...settings, ...newSettings };

    // Update modulation based on mod wheel and mod mix
    if (
      newSettings.modMix !== undefined ||
      newSettings.modWheel !== undefined
    ) {
      const modAmount = (settings.modWheel / 100) * settings.modMix;

      activeNotes.forEach((noteData) => {
        if (noteData.lfo) {
          // Scale LFO depth by mod amount
          const baseCutoff = Math.min(
            Math.max(settings.filter.cutoff, 20),
            20000
          );

          // Disconnect all LFO connections if modAmount is 0
          if (modAmount === 0) {
            noteData.lfoGains.filterCutoff.disconnect();
            noteData.lfoGains.filterResonance.disconnect();
            noteData.lfoGains.oscillatorPitch.disconnect();
            noteData.lfoGains.oscillatorVolume.disconnect();
          } else {
            // Reconnect LFO based on routing settings
            if (settings.lfo.routing.filterCutoff) {
              noteData.lfoGains.filterCutoff.connect(
                noteData.filterNode.frequency
              );
            }
            if (settings.lfo.routing.filterResonance) {
              noteData.lfoGains.filterResonance.connect(noteData.filterNode.Q);
            }
            if (settings.lfo.routing.oscillatorPitch) {
              noteData.oscillators.forEach((osc) => {
                if (osc) {
                  noteData.lfoGains.oscillatorPitch.connect(osc.detune);
                }
              });
            }
            if (settings.lfo.routing.oscillatorVolume) {
              noteData.oscillatorGains.forEach((gain) => {
                if (gain) {
                  noteData.lfoGains.oscillatorVolume.connect(gain.gain);
                }
              });
            }
          }

          const currentTime = context.currentTime;
          const smoothingTime = 0.01; // 10ms smoothing

          // Update gain values with smoothing
          noteData.lfoGains.filterCutoff.gain.setTargetAtTime(
            modAmount * settings.lfo.depth * baseCutoff,
            currentTime,
            smoothingTime
          );
          noteData.lfoGains.filterResonance.gain.setTargetAtTime(
            modAmount * settings.lfo.depth * 30,
            currentTime,
            smoothingTime
          );
          noteData.lfoGains.oscillatorPitch.gain.setTargetAtTime(
            modAmount * settings.lfo.depth * 100,
            currentTime,
            smoothingTime
          );
          noteData.lfoGains.oscillatorVolume.gain.setTargetAtTime(
            modAmount * settings.lfo.depth,
            currentTime,
            smoothingTime
          );
        }
      });
    }

    if (newSettings.distortion) {
      if (newSettings.distortion.outputGain !== undefined) {
        const mix = newSettings.distortion.outputGain / 100;
        const logMix = Math.pow(mix, 2);
        dryGain.gain.value = 1 - logMix;
        wetGain.gain.value = logMix;
      }
    }

    if (newSettings.reverb) {
      reverbGain.gain.value = newSettings.reverb.amount / 100;
    }

    if (newSettings.delay) {
      delayGain.gain.value = newSettings.delay.amount / 100;
    }

    activeNotes.forEach((noteData, note) => {
      const baseFrequency = noteToFrequency(note, settings.tune);

      noteData.oscillators.forEach((osc, index) => {
        if (index < settings.oscillators.length) {
          const oscSettings = settings.oscillators[index];
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
              context,
              oscSettings,
              baseFrequency
            );
            const newGain = createGainNode(context, volume);
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
            const baseQ = settings.filter.resonance * 30;
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

      if (noteData.lfo) {
        noteData.lfo.type = settings.lfo.waveform;
        noteData.lfo.frequency.value = settings.lfo.rate;
      }
    });

    if (
      newSettings.lfo?.waveform !== undefined ||
      newSettings.lfo?.rate !== undefined ||
      newSettings.lfo?.depth !== undefined ||
      newSettings.lfo?.routing !== undefined
    ) {
      activeNotes.forEach((noteData) => {
        if (noteData.lfo) {
          if (newSettings.lfo?.waveform !== undefined) {
            noteData.lfo.type = newSettings.lfo.waveform;
          }
          if (newSettings.lfo?.rate !== undefined) {
            noteData.lfo.frequency.value = newSettings.lfo.rate;
          }
          if (newSettings.lfo?.depth !== undefined) {
            const baseCutoff = Math.min(
              Math.max(settings.filter.cutoff, 20),
              20000
            );
            const currentTime = context.currentTime;
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
      activeNotes.forEach((noteData) => {
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

  function triggerAttack(note: Note) {
    const now = context.currentTime;

    noteStates.set(note, {
      isPlaying: true,
      isReleased: false,
      startTime: now,
      releaseTime: null,
    });

    // Find the last active note for glide before cleaning up
    const lastActiveNote = Array.from(activeNotes.keys())[0];
    const lastFrequency = lastActiveNote
      ? noteToFrequency(lastActiveNote, settings.tune)
      : null;

    if (activeNotes.has(note)) {
      const existingNote = activeNotes.get(note);
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

        activeNotes.delete(note);
      }
    }

    const hasActiveOscillators = settings.oscillators.some(
      (osc) => (osc.volume ?? 0) > 0
    );
    if (!hasActiveOscillators) return;

    const targetFrequency = noteToFrequency(note, settings.tune);
    const noteGain = createGainNode(context, 0);
    const filter = context.createBiquadFilter();
    const baseCutoff = Math.min(Math.max(settings.filter.cutoff, 20), 20000);
    filter.type = settings.filter.type;
    filter.frequency.value = baseCutoff;

    // Adjust Q value based on filter type
    const baseQ = settings.filter.resonance * 30;
    if (settings.filter.type === "notch") {
      // Make notch filter more pronounced
      filter.Q.value = baseQ * 2;
    } else if (settings.filter.type === "bandpass") {
      // Make bandpass filter more focused
      filter.Q.value = baseQ * 1.5;
    } else {
      filter.Q.value = baseQ;
    }

    // Add gain boost for bandpass filter
    const filterGain = createGainNode(
      context,
      settings.filter.type === "bandpass" ? 4 : 1
    );
    filter.connect(filterGain);
    filterGain.connect(masterGain);

    // Create LFO
    const lfo = context.createOscillator();
    lfo.type = settings.lfo.waveform;
    lfo.frequency.value = settings.lfo.rate;

    // Create LFO gains for each routing destination
    const lfoGains = {
      filterCutoff: createGainNode(context, 0),
      filterResonance: createGainNode(context, 0),
      oscillatorPitch: createGainNode(context, 0),
      oscillatorVolume: createGainNode(context, 0),
    };

    // Connect LFO to each gain node
    lfo.connect(lfoGains.filterCutoff);
    lfo.connect(lfoGains.filterResonance);
    lfo.connect(lfoGains.oscillatorPitch);
    lfo.connect(lfoGains.oscillatorVolume);

    // Connect each gain to its destination based on routing settings
    if (settings.lfo.routing.filterCutoff) {
      lfoGains.filterCutoff.connect(filter.frequency);
    }
    if (settings.lfo.routing.filterResonance) {
      lfoGains.filterResonance.connect(filter.Q);
    }

    lfo.start();

    // Update LFO gains based on mod wheel and mod mix
    const modAmount = (settings.modWheel / 100) * settings.modMix;
    const currentTime = context.currentTime;
    const smoothingTime = 0.01; // 10ms smoothing

    lfoGains.filterCutoff.gain.setTargetAtTime(
      modAmount * settings.lfo.depth * baseCutoff,
      currentTime,
      smoothingTime
    );
    lfoGains.filterResonance.gain.setTargetAtTime(
      modAmount * settings.lfo.depth * 30,
      currentTime,
      smoothingTime
    );
    lfoGains.oscillatorPitch.gain.setTargetAtTime(
      modAmount * settings.lfo.depth * 100,
      currentTime,
      smoothingTime
    );
    lfoGains.oscillatorVolume.gain.setTargetAtTime(
      modAmount * settings.lfo.depth,
      currentTime,
      smoothingTime
    );

    const filterEnvelope = createGainNode(context, 0);
    const filterModGain = createGainNode(
      context,
      settings.filter.contourAmount * baseCutoff * 0.15
    );

    noteGain.connect(filterEnvelope);
    filterEnvelope.connect(filterModGain);
    filterModGain.connect(filter.frequency);

    // Connect the main signal chain
    noteGain.connect(filter);
    filter.connect(masterGain);

    const oscillators: OscillatorNode[] = [];
    const oscillatorGains: GainNode[] = [];
    const oscillatorPanners: StereoPannerNode[] = [];

    const startTime = now;

    settings.oscillators.forEach((oscSettings) => {
      const volume = oscSettings.volume ?? 0;
      if (volume > 0) {
        // Calculate the starting frequency based on glide
        const rangeMultiplier = getRangeMultiplier(oscSettings.range);
        const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
        const finalFrequency =
          targetFrequency * rangeMultiplier * frequencyOffset;

        // If glide is enabled and we have a previous note, start from its frequency
        const startFrequency =
          settings.glide > 0 && lastFrequency
            ? lastFrequency * rangeMultiplier * frequencyOffset
            : finalFrequency;

        const osc = createOscillator(
          context,
          {
            ...oscSettings,
            type: oscSettings.waveform,
          },
          startFrequency
        );

        const gainNode = createGainNode(context, volume);
        const panner = context.createStereoPanner();
        panner.pan.value = oscSettings.pan ?? 0;

        osc.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(noteGain);
        osc.start(startTime);

        // Apply glide if enabled
        if (settings.glide > 0 && lastFrequency) {
          const glideTime = settings.glide * 0.5; // Scale glide time (0-1 to 0-0.5 seconds)
          osc.frequency.linearRampToValueAtTime(
            finalFrequency,
            startTime + glideTime
          );
        }

        // Connect LFO to oscillator if routing is enabled
        if (settings.lfo.routing.oscillatorPitch) {
          lfoGains.oscillatorPitch.connect(osc.detune);
        }
        if (settings.lfo.routing.oscillatorVolume) {
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

    noteGain.connect(filter);
    filter.connect(masterGain);

    activeNotes.set(note, {
      oscillators,
      oscillatorGains,
      oscillatorPanners,
      gainNode: noteGain,
      filterNode: filter,
      noiseNode,
      noiseGain,
      lfo,
      lfoGains,
      filterEnvelope,
      filterModGain,
    });
  }

  function triggerRelease(note: Note) {
    const noteData = activeNotes.get(note);
    const noteState = noteStates.get(note);

    if (!noteData || !noteState || noteState.isReleased) return;

    const now = context.currentTime;
    noteState.isReleased = true;
    noteState.releaseTime = now;

    noteData.gainNode.gain.cancelScheduledValues(now);
    noteData.filterEnvelope.gain.cancelScheduledValues(now);

    const currentGain = noteData.gainNode.gain.value;
    const currentFilterGain = noteData.filterEnvelope.gain.value;

    noteData.gainNode.gain.setValueAtTime(currentGain, now);
    noteData.gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + settings.envelope.release
    );

    noteData.filterEnvelope.gain.setValueAtTime(currentFilterGain, now);
    noteData.filterEnvelope.gain.exponentialRampToValueAtTime(
      0.001,
      now + settings.envelope.release
    );

    noteData.lfo.stop();
    noteData.lfoGains.filterCutoff.disconnect();
    noteData.lfoGains.filterResonance.disconnect();
    noteData.lfoGains.oscillatorPitch.disconnect();
    noteData.lfoGains.oscillatorVolume.disconnect();

    setTimeout(() => {
      const currentState = noteStates.get(note);
      if (!currentState || !currentState.isReleased) return;

      if (activeNotes.has(note)) {
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

        try {
          noteData.filterEnvelope.disconnect();
          noteData.filterModGain.disconnect();
        } catch (e) {
          console.warn("Error stopping filter envelope:", e);
        }

        activeNotes.delete(note);
        noteStates.delete(note);
      }
    }, settings.envelope.release * 1000); // Convert release time to milliseconds
  }

  function handleNoteTransition(fromNote: Note | null, toNote: Note) {
    if (fromNote) {
      triggerRelease(fromNote);
    }
    triggerAttack(toNote);
  }

  function dispose() {
    activeNotes.forEach((_, note) => triggerRelease(note));
    noteStates.clear();
    masterGain.disconnect();
    context.close();
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
