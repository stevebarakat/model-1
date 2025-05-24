import { useSynthStore } from "./store/synthStore";
import styles from "./styles/App.module.css";
import "./styles/variables.css";
import PresetSelector from "./components/PresetSelector/PresetSelector";
import { presets } from "./synth/presets";
import Synth from "./components/Synth/Synth";

function App() {
  const {
    setOctave,
    setGlide,
    updateMixer,
    setModWheel,
    setOscillator,
    updateNoise,
    updateModifiers,
    updateEffects,
  } = useSynthStore();

  const handlePresetSelect = (presetName: string) => {
    const preset = presets[presetName];
    if (!preset) return;

    // Update all synth settings
    setOctave(preset.octave);
    setGlide(preset.glide);
    updateMixer({ modMix: preset.modMix });
    setModWheel(preset.modWheel);

    // Update oscillators
    preset.oscillators.forEach((osc, index) => {
      setOscillator((index + 1) as 1 | 2 | 3, {
        ...osc,
        enabled: true,
      });
    });

    // Update noise
    updateNoise(preset.noise);

    // Update modifiers
    updateModifiers({
      cutoff: preset.filter.cutoff,
      resonance: preset.filter.resonance,
      contourAmount: preset.filter.contourAmount,
      filterType: preset.filter.type,
      envelope: preset.envelope,
      lfo: preset.lfo,
    });

    // Update effects
    updateEffects({
      reverb: preset.reverb,
      distortion: preset.distortion,
      delay: preset.delay,
    });
  };

  return (
    <div className={styles.appContainer}>
      <PresetSelector onPresetSelect={handlePresetSelect} />
      <Synth />
    </div>
  );
}

export default App;
