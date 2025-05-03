import { useState, useRef, useEffect } from "react";
import { createSynth } from "./synth/WebAudioSynth";
import Keyboard from "./components/Keyboard";
import Controllers from "./components/Controllers/Controllers";
import OscillatorBank from "./components/OscillatorBank/OscillatorBank";
import Mixer from "./components/Mixer/Mixer";
import Modifiers from "./components/Modifiers/Modifiers";
import Effects from "./components/Effects/Effects";
import SidePanel from "./components/SidePanel/SidePanel";
import styles from "./styles/App.module.css";
import "./styles/variables.css";
import { OscillatorSettings } from "./synth/types";

type Note = string;

function App() {
  const [activeKeys, setActiveKeys] = useState<Set<Note>>(new Set());
  const keyboardRef = useRef<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>({ synth: null });

  // Replace slider value state with pitch and mod wheel states
  const [pitchWheel, setPitchWheel] = useState(50);
  const [modWheel, setModWheel] = useState(0);

  // Controllers state
  const [tune, setTune] = useState(0);
  const [modMix, setModMix] = useState(0);

  // Oscillator Bank state
  const [osc1, setOsc1] = useState<OscillatorSettings>({
    frequency: 0,
    waveform: "triangle",
    range: "8",
  });
  const [osc2, setOsc2] = useState<OscillatorSettings>({
    frequency: 0,
    waveform: "triangle",
    range: "8",
  });
  const [osc3, setOsc3] = useState<OscillatorSettings>({
    frequency: 0,
    waveform: "triangle",
    range: "8",
  });

  // Mixer state
  const [osc1Volume, setOsc1Volume] = useState(0.7);
  const [osc2Volume, setOsc2Volume] = useState(0.7);
  const [osc3Volume, setOsc3Volume] = useState(0.7);
  const [noiseVolume, setNoiseVolume] = useState(0);
  const [noiseType, setNoiseType] = useState<"white" | "pink">("white");

  // Modifiers state
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(0);
  const [contourAmount, setContourAmount] = useState(0);
  const [attackTime, setAttackTime] = useState(0.1);
  const [decayTime, setDecayTime] = useState(0.1);
  const [sustainLevel, setSustainLevel] = useState(0.7);
  const [releaseTime, setReleaseTime] = useState(0.3);
  const [lfoRate, setLfoRate] = useState(5);
  const [lfoDepth, setLfoDepth] = useState(0.5);

  // Reverb state
  const [reverbAmount, setReverbAmount] = useState(0);

  // Distortion state
  const [distortionOutputGain, setDistortionOutputGain] = useState(0);

  // Delay state
  const [delayAmount, setDelayAmount] = useState(0);

  // Add octave state
  const [currentOctave, setCurrentOctave] = useState(4);

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
        setCurrentOctave((prev) => Math.min(prev + 1, 7)); // Limit to 7th octave
        return;
      }
      if (e.key === "-" || e.key === "_") {
        // Release all active notes before changing octave
        activeKeys.forEach((note) => handleKeyUp(note));
        setCurrentOctave((prev) => Math.max(prev - 1, 1)); // Limit to 1st octave
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
  }, [currentOctave, activeKeys]);

  // Initialize synth
  useEffect(() => {
    const initSynth = async () => {
      const synth = await createSynth();
      keyboardRef.current.synth = synth;
    };
    initSynth();
  }, []);

  // Initialize synth settings when keyboard ref is available
  useEffect(() => {
    if (keyboardRef.current.synth) {
      keyboardRef.current.synth.updateSettings({
        oscillators: [
          { ...osc1, type: osc1.waveform, volume: osc1Volume, detune: 0 },
          { ...osc2, type: osc2.waveform, volume: osc2Volume, detune: 0 },
          { ...osc3, type: osc3.waveform, volume: osc3Volume, detune: 0 },
        ],
        envelope: {
          attack: attackTime,
          decay: decayTime,
          sustain: sustainLevel,
          release: releaseTime,
        },
        filter: {
          cutoff,
          resonance,
          contourAmount,
        },
        noise: {
          type: noiseType,
          volume: noiseVolume,
        },
        tune,
        modMix,
        lfo: {
          rate: lfoRate,
          depth: lfoDepth,
        },
      });
    }
  }, [
    keyboardRef.current.synth,
    osc1,
    osc2,
    osc3,
    osc1Volume,
    osc2Volume,
    osc3Volume,
    attackTime,
    decayTime,
    sustainLevel,
    cutoff,
    resonance,
    contourAmount,
    noiseType,
    noiseVolume,
    releaseTime,
    tune,
    modMix,
    lfoRate,
    lfoDepth,
    currentOctave,
  ]);

  // Update synth settings when reverb controls change
  useEffect(() => {
    if (keyboardRef.current.synth) {
      keyboardRef.current.synth.updateSettings({
        reverb: {
          amount: reverbAmount,
        },
      });
    }
  }, [reverbAmount]);

  // Update synth settings when distortion controls change
  useEffect(() => {
    if (keyboardRef.current.synth) {
      keyboardRef.current.synth.updateSettings({
        distortion: {
          outputGain: distortionOutputGain,
        },
      });
    }
  }, [distortionOutputGain]);

  // Update synth settings when delay controls change
  useEffect(() => {
    if (keyboardRef.current.synth) {
      keyboardRef.current.synth.updateSettings({
        delay: {
          amount: delayAmount,
        },
      });
    }
  }, [delayAmount]);

  const handleKeyDown = (note: Note) => {
    // Store the original note for visual state
    setActiveKeys((prev) => {
      const newSet = new Set(prev);
      newSet.add(note);
      return newSet;
    });

    // Use the note directly without octave conversion since noteToFrequency handles it
    keyboardRef.current.synth?.triggerAttack(note);
  };

  const handleKeyUp = (note: Note) => {
    // Remove the original note from visual state
    setActiveKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });

    // Use the note directly without octave conversion since noteToFrequency handles it
    keyboardRef.current.synth?.triggerRelease(note);
  };

  const handleOsc1Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOsc1((prev) => {
      const updated = { ...prev, [param]: value };
      return updated;
    });
  };

  const handleOsc2Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOsc2((prev) => {
      const updated = { ...prev, [param]: value };
      return updated;
    });
  };

  const handleOsc3Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOsc3((prev) => {
      const updated = { ...prev, [param]: value };
      return updated;
    });
  };

  return (
    <div className={styles.synthSides}>
      <div className={styles.synth}>
        <div className={styles.controlsContainer}>
          <div className={styles.backPanel}></div>
          <div className={styles.innerControlsContainer}>
            <Controllers
              tune={tune}
              modMix={modMix}
              onTuneChange={setTune}
              onModMixChange={setModMix}
            />
            <div className={styles.indent}></div>
            <div className="box">
              <OscillatorBank
                osc1={osc1}
                osc2={osc2}
                osc3={osc3}
                onOsc1Change={handleOsc1Change}
                onOsc2Change={handleOsc2Change}
                onOsc3Change={handleOsc3Change}
              />
            </div>
            <div className={styles.indent}></div>
            <Mixer
              osc1Volume={osc1Volume}
              osc2Volume={osc2Volume}
              osc3Volume={osc3Volume}
              noiseVolume={noiseVolume}
              noiseType={noiseType}
              onOsc1VolumeChange={setOsc1Volume}
              onOsc2VolumeChange={setOsc2Volume}
              onOsc3VolumeChange={setOsc3Volume}
              onNoiseVolumeChange={setNoiseVolume}
              onNoiseTypeChange={setNoiseType}
            />
            <div className={styles.indent}></div>
            <Modifiers
              cutoff={cutoff}
              resonance={resonance}
              contourAmount={contourAmount}
              attackTime={attackTime}
              decayTime={decayTime}
              sustainLevel={sustainLevel}
              releaseTime={releaseTime}
              lfoRate={lfoRate}
              lfoDepth={lfoDepth}
              onCutoffChange={setCutoff}
              onResonanceChange={setResonance}
              onContourAmountChange={setContourAmount}
              onAttackTimeChange={setAttackTime}
              onDecayTimeChange={setDecayTime}
              onSustainLevelChange={setSustainLevel}
              onReleaseTimeChange={setReleaseTime}
              onLfoRateChange={setLfoRate}
              onLfoDepthChange={setLfoDepth}
            />
            <div className={styles.indent}></div>
            <Effects
              reverbAmount={reverbAmount}
              delayAmount={delayAmount}
              distortionAmount={distortionOutputGain}
              onReverbAmountChange={setReverbAmount}
              onDelayAmountChange={setDelayAmount}
              onDistortionAmountChange={setDistortionOutputGain}
            />
            <div className={styles.indent}></div>
          </div>
          <div className={styles.horizontalIndent}></div>
        </div>
        <div className={styles.keyRow}>
          <SidePanel
            pitchWheel={pitchWheel}
            modWheel={modWheel}
            currentOctave={currentOctave}
            onPitchWheelChange={(value) => {
              setPitchWheel(value);
              // Convert 0-100 range to -12 to +12 semitones
              const semitones = ((value - 50) / 50) * 12;
              setTune(semitones);
            }}
            onModWheelChange={(value) => {
              setModWheel(value);
              // Convert 0-100 range to 0-1 range
              setModMix(value / 100);
            }}
            onPitchWheelReset={() => {
              setPitchWheel(50);
              setTune(0);
            }}
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
