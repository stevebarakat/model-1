import { useRef, useEffect } from "react";
import { useKeyboardHandling } from "./hooks";
import createSynth from "./synth/WebAudioSynth";
import SynthControls from "./components/SynthControls";
import Keyboard from "./components/Keyboard";
import SidePanel from "./components/SidePanel";
import { useSynthStore } from "./store/synthStore";
import styles from "./styles/App.module.css";
import "./styles/variables.css";

function App() {
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
    noise,
    updateNoise,
    tune,
    setTune,
  } = useSynthStore();

  const keyboardRef = useRef<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>({ synth: null });

  const { handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp } =
    useKeyboardHandling({
      keyboardRef,
      activeKeys,
      setActiveKeys,
      currentOctave,
      setCurrentOctave,
    });

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
        noise: {
          volume: noise.volume,
          pan: noise.pan,
          type: noise.type,
          tone: noise.tone,
        },
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
        tune: tune + ((pitchWheel - 50) / 50) * 100,
        modMix: mixer.modMix,
        modWheel,
        glide,
        lfo: {
          rate: modifiers.lfo.rate,
          depth: modifiers.lfo.depth,
          waveform: modifiers.lfo.waveform,
          routing: modifiers.lfo.routing,
        },
        reverb: effects.reverb,
        delay: effects.delay,
        distortion: effects.distortion,
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
    tune,
    effects,
    noise,
  ]);

  return (
    <div className={styles.synthSides}>
      <div className={styles.synth}>
        <div className={styles.controlsContainer}>
          <div className={styles.backPanel}></div>
          <div className={styles.innerControlsContainer}>
            <SynthControls
              oscillators={oscillators}
              mixer={mixer}
              noise={noise}
              modifiers={modifiers}
              effects={effects}
              onOscillatorChange={setOscillator}
              onMixerChange={updateMixer}
              onNoiseChange={updateNoise}
              onModifiersChange={updateModifiers}
              onEffectsChange={updateEffects}
            />
          </div>
          <div className={styles.horizontalIndent}></div>
        </div>
        <div className={styles.keyRow}>
          <SidePanel
            pitchWheel={pitchWheel}
            modWheel={modWheel}
            onPitchWheelChange={setPitchWheel}
            onModWheelChange={(value) => {
              setModWheel(value);
              updateMixer({ modMix: value / 100 });
            }}
            onPitchWheelReset={() => setPitchWheel(50)}
            glide={glide}
            onGlideChange={setGlide}
            currentOctave={currentOctave}
            onOctaveChange={setCurrentOctave}
            onOctaveChangeStart={() => {
              activeKeys.forEach((note) => handleKeyUp(note));
            }}
            tune={tune}
            onTuneChange={setTune}
          />

          <Keyboard
            ref={keyboardRef}
            activeKeys={Array.from(activeKeys)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            octaveRange={{ min: currentOctave, max: currentOctave + 2 }}
            synth={keyboardRef.current.synth}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
