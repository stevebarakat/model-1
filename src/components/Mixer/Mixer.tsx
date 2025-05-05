import Knob from "../Knob/Knob";
import styles from "./Mixer.module.css";
import Switch from "../Switch";

type NoiseType = "white" | "pink";

type MixerProps = {
  osc1Volume: number;
  osc2Volume: number;
  osc3Volume: number;
  osc1Pan: number;
  osc2Pan: number;
  osc3Pan: number;
  noiseVolume: number;
  noiseType: NoiseType;
  modMix: number;
  onModMixChange: (value: number) => void;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onOsc1PanChange: (value: number) => void;
  onOsc2PanChange: (value: number) => void;
  onOsc3PanChange: (value: number) => void;
  onNoiseVolumeChange: (value: number) => void;
  onNoiseTypeChange: (type: NoiseType) => void;
};

type OscillatorControlsProps = {
  volume: number;
  pan: number;
  label: string;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
};

function OscillatorControls({
  volume,
  pan,
  label,
  onVolumeChange,
  onPanChange,
}: OscillatorControlsProps) {
  return (
    <div className={styles.mixerRow}>
      <Knob
        value={volume}
        min={0}
        max={1}
        step={0.01}
        label={label}
        onChange={onVolumeChange}
      />
      <Knob
        value={pan}
        min={-1}
        max={1}
        step={0.01}
        label="Pan"
        onChange={onPanChange}
      />
    </div>
  );
}

type NoiseControlsProps = {
  volume: number;
  type: NoiseType;
  onVolumeChange: (value: number) => void;
  onTypeChange: (type: NoiseType) => void;
};

function NoiseControls({
  volume,
  type,
  onVolumeChange,
  onTypeChange,
}: NoiseControlsProps) {
  return (
    <>
      <Knob
        value={volume}
        min={0}
        max={1}
        step={0.01}
        label="Noise"
        onChange={onVolumeChange}
      />
      <div className={styles.switchContainer}>
        <Switch
          checked={type === "pink"}
          onCheckedChange={(checked) =>
            onTypeChange(checked ? "pink" : "white")
          }
          label={type === "white" ? "White" : "Pink"}
        />
      </div>
    </>
  );
}

function Mixer({
  osc1Volume,
  osc2Volume,
  osc3Volume,
  osc1Pan,
  osc2Pan,
  osc3Pan,
  noiseVolume,
  noiseType,
  modMix,
  onModMixChange,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onOsc1PanChange,
  onOsc2PanChange,
  onOsc3PanChange,
  onNoiseVolumeChange,
  onNoiseTypeChange,
}: MixerProps) {
  return (
    <div className="box">
      <div className={styles.mixer}>
        <div className="controls">
          <div>
            <OscillatorControls
              volume={osc1Volume}
              pan={osc1Pan}
              label="Osc 1"
              onVolumeChange={onOsc1VolumeChange}
              onPanChange={onOsc1PanChange}
            />
            <OscillatorControls
              volume={osc2Volume}
              pan={osc2Pan}
              label="Osc 2"
              onVolumeChange={onOsc2VolumeChange}
              onPanChange={onOsc2PanChange}
            />
            <OscillatorControls
              volume={osc3Volume}
              pan={osc3Pan}
              label="Osc 3"
              onVolumeChange={onOsc3VolumeChange}
              onPanChange={onOsc3PanChange}
            />
          </div>
          <div className={styles.mixerColumn}>
            <NoiseControls
              volume={noiseVolume}
              type={noiseType}
              onVolumeChange={onNoiseVolumeChange}
              onTypeChange={onNoiseTypeChange}
            />
            <Knob
              value={modMix}
              min={0}
              max={1}
              step={0.01}
              label="Mod"
              onChange={onModMixChange}
            />
          </div>
        </div>
        <span className="section-title">Mixer</span>
      </div>
    </div>
  );
}

export default Mixer;
