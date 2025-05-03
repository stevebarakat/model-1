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
  let lastFrequency = 440;

  let settings: SynthSettings = {
    tune: 0,
    glide: 0,
    modMix: 0,
    oscillators: [
      {
        type: "triangle",
        frequency: 0,
        range: "8",
        volume: 0.7,
        detune: 0,
      },
      {
        type: "triangle",
        frequency: 0,
        range: "8",
        volume: 0.7,
        detune: 0,
      },
      {
        type: "triangle",
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

  function updateSettings(newSettings: Partial<typeof settings>) {
    settings = { ...settings, ...newSettings };

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

          if (oscSettings.volume === 0 && osc) {
            osc.stop();
            osc.disconnect();
            if (noteData.oscillatorGains[index]) {
              noteData.oscillatorGains[index].disconnect();
            }
            noteData.oscillators[index] = null as unknown as OscillatorNode;
            noteData.oscillatorGains[index] = null as unknown as GainNode;
          } else if (oscSettings.volume > 0 && !osc) {
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
          } else if (osc && oscSettings.volume > 0) {
            osc.type = oscSettings.type;
            const rangeMultiplier = getRangeMultiplier(oscSettings.range);
            const frequencyOffset = Math.pow(2, oscSettings.frequency / 12);
            const newFrequency =
              baseFrequency * rangeMultiplier * frequencyOffset;
            osc.frequency.value = newFrequency;
            osc.detune.value = oscSettings.detune;

            if (noteData.oscillatorGains[index]) {
              noteData.oscillatorGains[index].gain.value = oscSettings.volume;
            }
          }
        }
      });

      if (noteData.filterNode) {
        noteData.filterNode.frequency.value = settings.filter.cutoff;
        noteData.filterNode.Q.value = settings.filter.resonance * 30;
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
    });
  }

  function triggerAttack(note: Note) {
    const now = context.currentTime;

    noteStates.set(note, {
      isPlaying: true,
      isReleased: false,
      startTime: now,
      releaseTime: null,
    });

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
          existingNote.lfoGain.disconnect();
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
      (osc) => osc.volume > 0
    );
    if (!hasActiveOscillators) return;

    const targetFrequency = noteToFrequency(note, settings.tune);
    const noteGain = createGainNode(context, 0);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";

    const baseCutoff = Math.min(Math.max(settings.filter.cutoff, 20), 20000);
    filter.frequency.value = baseCutoff;
    filter.Q.value = settings.filter.resonance * 30;

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
    noteData.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

    noteData.filterEnvelope.gain.setValueAtTime(currentFilterGain, now);
    noteData.filterEnvelope.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.01
    );

    noteData.lfo.stop();
    noteData.lfoGain.disconnect();

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
    }, 20);
  }

  function handleNoteTransition(fromNote: Note | null, toNote: Note) {
    const toFrequency = noteToFrequency(toNote, settings.tune);
    const now = context.currentTime;
    const glideTime = settings.glide * 0.5;

    if (fromNote && settings.glide > 0) {
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
