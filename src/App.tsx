import { useRef, useEffect, useCallback } from "react";
import { createSynth } from "./synth/WebAudioSynth";
import Keyboard from "./components/Keyboard";
import OscillatorBank from "./components/OscillatorBank/OscillatorBank";
import Mixer from "./components/Mixer/Mixer";
import Modifiers from "./components/Modifiers/Modifiers";
import Effects from "./components/Effects/Effects";
import SidePanel from "./components/SidePanel/SidePanel";
import styles from "./styles/App.module.css";
import "./styles/variables.css";
import { useSynthStore } from "./store/synthStore";
import { OscillatorSettings, FilterType } from "./synth/types";

type Note = string;

function App() {
  // Get all needed state from Zustand store
  const {
    activeKeys,
    setActiveKeys,
    pitchWheel,
    setPitchWheel,
    modWheel,
    setModWheel,
    currentOctave,
    setCurrentOctave,
    glide,
    setGlide,
    effects,
    updateEffects,
    oscillators,
    setOscillator,
    mixer,
    updateMixer,
    modifiers,
    updateModifiers,
  } = useSynthStore();

  const keyboardRef = useRef<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>({ synth: null });

  const handleKeyDown = useCallback(
    (note: Note) => {
      // Store the original note for visual state
      setActiveKeys((prev: Set<Note>) => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });

      // Use the note directly without octave conversion since noteToFrequency handles it
      keyboardRef.current.synth?.triggerAttack(note);
    },
    [setActiveKeys]
  );

  const handleKeyUp = useCallback(
    (note: Note) => {
      // Remove the original note from visual state
      setActiveKeys((prev: Set<Note>) => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });

      // Use the note directly without octave conversion since noteToFrequency handles it
      keyboardRef.current.synth?.triggerRelease(note);
    },
    [setActiveKeys]
  );

  // Add keyboard event listeners
  useEffect(() => {
    // Base keyboard mapping (without octave)
    const baseKeyboardMap: { [key: string]: string } = {
      a: "C",
      w: "C#",
      s: "D",
      e: "D#",
      d: "E",
      f: "F",
      t: "F#",
      g: "G",
      y: "G#",
      h: "A",
      u: "A#",
      j: "B",
      k: "C+1", // Special marker for next octave
    };
    const handleKeyboardDown = (e: KeyboardEvent) => {
      if (!e.key) return;

      // Handle octave changes
      if (e.key === "+" || e.key === "=") {
        // Release all active notes before changing octave
        activeKeys.forEach((note) => handleKeyUp(note));
        setCurrentOctave(Math.min(currentOctave + 1, 7)); // Limit to 7th octave
        return;
      }
      if (e.key === "-" || e.key === "_") {
        // Release all active notes before changing octave
        activeKeys.forEach((note) => handleKeyUp(note));
        setCurrentOctave(Math.max(currentOctave - 1, 1)); // Limit to 1st octave
        return;
      }

      const baseNote = baseKeyboardMap[e.key.toLowerCase()];
      if (baseNote && !e.repeat) {
        // Handle special case for K key (next octave)
        const note =
          baseNote === "C+1"
            ? `C${currentOctave + 1}`
            : `${baseNote}${currentOctave}`;
        handleKeyDown(note);
      }
    };

    const handleKeyboardUp = (e: KeyboardEvent) => {
      if (!e.key) return;

      const baseNote = baseKeyboardMap[e.key.toLowerCase()];
      if (baseNote) {
        // Handle special case for K key (next octave)
        const note =
          baseNote === "C+1"
            ? `C${currentOctave + 1}`
            : `${baseNote}${currentOctave}`;
        handleKeyUp(note);
      }
    };

    window.addEventListener("keydown", handleKeyboardDown);
    window.addEventListener("keyup", handleKeyboardUp);

    return () => {
      window.removeEventListener("keydown", handleKeyboardDown);
      window.removeEventListener("keyup", handleKeyboardUp);
    };
  }, [currentOctave, activeKeys, setCurrentOctave, handleKeyUp, handleKeyDown]);

  // Initialize synth
  useEffect(() => {
    const initSynth = async () => {
      const synth = await createSynth();
      keyboardRef.current.synth = synth;
    };
    initSynth();
  }, []);

  // Update synth settings when keyboard ref is available
  useEffect(() => {
    if (keyboardRef.current.synth) {
      keyboardRef.current.synth.updateSettings({
        oscillators: [
          {
            ...oscillators.osc1,
            type: oscillators.osc1.waveform,
            volume: mixer.osc1Volume,
            detune: oscillators.osc1.detune,
          },
          {
            ...oscillators.osc2,
            type: oscillators.osc2.waveform,
            volume: mixer.osc2Volume,
            detune: oscillators.osc2.detune,
          },
          {
            ...oscillators.osc3,
            type: oscillators.osc3.waveform,
            volume: mixer.osc3Volume,
            detune: oscillators.osc3.detune,
          },
        ],
        envelope: {
          attack: modifiers.envelope.attack,
          decay: modifiers.envelope.decay,
          sustain: modifiers.envelope.sustain,
          release: modifiers.envelope.release,
        },
        filter: {
          cutoff: modifiers.cutoff,
          resonance: modifiers.resonance,
          contourAmount: modifiers.contourAmount,
          type: modifiers.filterType,
        },
        noise: {
          type: mixer.noiseType,
          volume: mixer.noiseVolume,
        },
        tune: ((pitchWheel - 50) / 50) * 12,
        modMix: mixer.modMix,
        modWheel,
        glide,
        lfo: {
          rate: modifiers.lfo.rate,
          depth: modifiers.lfo.depth,
          waveform: modifiers.lfo.waveform,
          routing: modifiers.lfo.routing,
        },
      });
    }
  }, [
    keyboardRef.current.synth,
    oscillators,
    mixer,
    modifiers,
    pitchWheel,
    modWheel,
    glide,
  ]);

  const handleOsc1Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOscillator(1, {
      ...oscillators.osc1,
      [param]: value,
    });
  };

  const handleOsc2Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOscillator(2, {
      ...oscillators.osc2,
      [param]: value,
    });
  };

  const handleOsc3Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOscillator(3, {
      ...oscillators.osc3,
      [param]: value,
    });
  };

  return (
    <div className={styles.synthSides}>
      <div className={styles.synth}>
        <div className={styles.controlsContainer}>
          <div className={styles.backPanel}></div>
          <div className={styles.innerControlsContainer}>
            <Mixer
              osc1Volume={mixer.osc1Volume}
              osc2Volume={mixer.osc2Volume}
              osc3Volume={mixer.osc3Volume}
              noiseVolume={mixer.noiseVolume}
              noiseType={mixer.noiseType}
              modMix={mixer.modMix}
              onModMixChange={(value) => {
                updateMixer({ modMix: value });
                setModWheel(value * 100); // Convert 0-1 range to 0-100 range
              }}
              onOsc1VolumeChange={(value) => updateMixer({ osc1Volume: value })}
              onOsc2VolumeChange={(value) => updateMixer({ osc2Volume: value })}
              onOsc3VolumeChange={(value) => updateMixer({ osc3Volume: value })}
              onNoiseVolumeChange={(value) =>
                updateMixer({ noiseVolume: value })
              }
              onNoiseTypeChange={(value) => updateMixer({ noiseType: value })}
            />
            <div className={styles.indent}></div>
            <div className={styles.indent}></div>
            <div className="box">
              <OscillatorBank
                osc1={oscillators.osc1}
                osc2={oscillators.osc2}
                osc3={oscillators.osc3}
                onOsc1Change={handleOsc1Change}
                onOsc2Change={handleOsc2Change}
                onOsc3Change={handleOsc3Change}
              />
            </div>
            <div className={styles.indent}></div>
            <Modifiers
              cutoff={modifiers.cutoff}
              resonance={modifiers.resonance}
              contourAmount={modifiers.contourAmount}
              filterType={modifiers.filterType}
              attackTime={modifiers.envelope.attack}
              decayTime={modifiers.envelope.decay}
              sustainLevel={modifiers.envelope.sustain}
              releaseTime={modifiers.envelope.release}
              lfoRate={modifiers.lfo.rate}
              lfoDepth={modifiers.lfo.depth}
              lfoWaveform={modifiers.lfo.waveform}
              lfoRouting={modifiers.lfo.routing}
              onCutoffChange={(value) => updateModifiers({ cutoff: value })}
              onResonanceChange={(value) =>
                updateModifiers({ resonance: value })
              }
              onContourAmountChange={(value) =>
                updateModifiers({ contourAmount: value })
              }
              onFilterTypeChange={(type: BiquadFilterType) =>
                updateModifiers({ filterType: type as FilterType })
              }
              onAttackTimeChange={(value) =>
                updateModifiers({
                  envelope: { ...modifiers.envelope, attack: value },
                })
              }
              onDecayTimeChange={(value) =>
                updateModifiers({
                  envelope: { ...modifiers.envelope, decay: value },
                })
              }
              onSustainLevelChange={(value) =>
                updateModifiers({
                  envelope: { ...modifiers.envelope, sustain: value },
                })
              }
              onReleaseTimeChange={(value) =>
                updateModifiers({
                  envelope: { ...modifiers.envelope, release: value },
                })
              }
              onLfoRateChange={(value) =>
                updateModifiers({ lfo: { ...modifiers.lfo, rate: value } })
              }
              onLfoDepthChange={(value) =>
                updateModifiers({ lfo: { ...modifiers.lfo, depth: value } })
              }
              onLfoWaveformChange={(value) =>
                updateModifiers({ lfo: { ...modifiers.lfo, waveform: value } })
              }
              onLfoRoutingChange={(value) =>
                updateModifiers({ lfo: { ...modifiers.lfo, routing: value } })
              }
            />
            <div className={styles.indent}></div>
            <Effects
              reverbAmount={effects.reverb.amount}
              delayAmount={effects.delay.amount}
              distortionAmount={effects.distortion.outputGain}
              onReverbAmountChange={(value) =>
                updateEffects({ reverb: { amount: value } })
              }
              onDelayAmountChange={(value) =>
                updateEffects({ delay: { amount: value } })
              }
              onDistortionAmountChange={(value) =>
                updateEffects({ distortion: { outputGain: value } })
              }
            />
          </div>
          <div className={styles.horizontalIndent}></div>
        </div>
        <div className={styles.keyRow}>
          <SidePanel
            pitchWheel={pitchWheel}
            modWheel={modWheel}
            onPitchWheelChange={setPitchWheel}
            onModWheelChange={setModWheel}
            onPitchWheelReset={() => setPitchWheel(50)}
            glide={glide}
            onGlideChange={setGlide}
            currentOctave={currentOctave}
            onOctaveChange={setCurrentOctave}
            onOctaveChangeStart={() => {
              // Release all active notes before changing octave
              activeKeys.forEach((note) => handleKeyUp(note));
            }}
          />

          <Keyboard
            ref={keyboardRef}
            activeKeys={Array.from(activeKeys)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            octaveRange={{ min: currentOctave, max: currentOctave + 2 }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
