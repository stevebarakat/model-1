import { useRef, useEffect } from "react";
import { useKeyboardHandling } from "@/hooks";
import { useMidiHandling } from "@/hooks/useMidiHandling";
import { createSynth } from "@/synth/WebAudioSynth";
import SynthControls from "@/components/SynthControls";
import Keyboard from "@/components/Keyboard";
import SidePanel from "@/components/SidePanel";
import { useSynthSelectors } from "@/store/synthStore";
import styles from "./Synth.module.css";
import RightPanel from "@/components/RightPanel";

function Synth() {
  // Use optimized selectors to prevent unnecessary re-renders
  const activeKeys = useSynthSelectors.useActiveKeys();
  const setActiveKeys = useSynthSelectors.useSetActiveKeys();
  const currentOctave = useSynthSelectors.useCurrentOctave();
  const setCurrentOctave = useSynthSelectors.useSetCurrentOctave();

  const pitchWheel = useSynthSelectors.usePitchWheel();
  const setPitchWheel = useSynthSelectors.useSetPitchWheel();
  const modWheel = useSynthSelectors.useModWheel();
  const setModWheel = useSynthSelectors.useSetModWheel();
  const octave = useSynthSelectors.useOctave();
  const setOctave = useSynthSelectors.useSetOctave();
  const glide = useSynthSelectors.useGlide();
  const setGlide = useSynthSelectors.useSetGlide();

  const oscillators = useSynthSelectors.useOscillators();
  const mixer = useSynthSelectors.useMixer();
  const noise = useSynthSelectors.useNoise();
  const modifiers = useSynthSelectors.useModifiers();
  const effects = useSynthSelectors.useEffects();
  const arpeggiator = useSynthSelectors.useArpeggiator();

  const setKeyboardRef = useSynthSelectors.useSetKeyboardRef();
  const updateEffects = useSynthSelectors.useUpdateEffects();
  const setOscillator = useSynthSelectors.useSetOscillator();
  const updateMixer = useSynthSelectors.useUpdateMixer();
  const updateModifiers = useSynthSelectors.useUpdateModifiers();
  const updateNoise = useSynthSelectors.useUpdateNoise();
  const updateArpeggiator = useSynthSelectors.useUpdateArpeggiator();

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

  // Initialize MIDI handling
  useMidiHandling();

  // Initialize synth
  useEffect(() => {
    const initSynth = async () => {
      const synth = await createSynth();
      keyboardRef.current.synth = synth;
      setKeyboardRef(keyboardRef.current);
    };
    initSynth();
  }, [setKeyboardRef]);

  // Update synth settings when keyboard ref is available
  useEffect(() => {
    if (
      keyboardRef.current.synth &&
      oscillators &&
      mixer &&
      modifiers &&
      effects &&
      noise
    ) {
      keyboardRef.current.synth.updateSettings({
        oscillators: [
          {
            ...oscillators.osc1,
            type: oscillators.osc1.waveform,
            volume: mixer.osc1Volume,
            detune: oscillators.osc1.detune,
            enabled: oscillators.osc1.enabled,
          },
          {
            ...oscillators.osc2,
            type: oscillators.osc2.waveform,
            volume: mixer.osc2Volume,
            detune: oscillators.osc2.detune,
            enabled: oscillators.osc2.enabled,
          },
          {
            ...oscillators.osc3,
            type: oscillators.osc3.waveform,
            volume: mixer.osc3Volume,
            detune: oscillators.osc3.detune,
            enabled: oscillators.osc3.enabled,
          },
        ],
        noise: {
          volume: noise.volume,
          pan: noise.pan,
          type: noise.type,
          tone: noise.tone,
          sync: noise.sync,
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
        octave: octave + ((pitchWheel - 50) / 50) * 2,
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
    octave,
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
              arpeggiator={arpeggiator}
              onOscillatorChange={setOscillator}
              onMixerChange={updateMixer}
              onNoiseChange={updateNoise}
              onModifiersChange={updateModifiers}
              onEffectsChange={updateEffects}
              onArpeggiatorChange={updateArpeggiator}
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
          />

          <Keyboard
            activeKeys={activeKeys}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            octaveRange={{ min: currentOctave - 1, max: currentOctave + 1 }}
            synth={keyboardRef.current.synth}
          />

          <RightPanel
            octave={octave}
            onOctaveChange={setOctave}
            glide={glide}
            onGlideChange={setGlide}
          />
        </div>
      </div>
    </div>
  );
}

export default Synth;
