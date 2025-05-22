import Knob from "../Knob/Knob";
import Switch from "../Switch/Switch";
import styles from "./Mixer.module.css";

export type MixerProps = {
  osc1Volume: number;
  osc2Volume: number;
  osc3Volume: number;
  osc1Pan: number;
  osc2Pan: number;
  osc3Pan: number;
  osc1Enabled: boolean;
  osc2Enabled: boolean;
  osc3Enabled: boolean;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onOsc1PanChange: (value: number) => void;
  onOsc2PanChange: (value: number) => void;
  onOsc3PanChange: (value: number) => void;
  onOsc1EnabledChange: (enabled: boolean) => void;
  onOsc2EnabledChange: (enabled: boolean) => void;
  onOsc3EnabledChange: (enabled: boolean) => void;
};

type OscillatorControlsProps = {
  volume: number;
  pan: number;
  enabled: boolean;
  label: string;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onEnabledChange: (enabled: boolean) => void;
};

function OscillatorControls({
  volume,
  pan,
  enabled,
  label,
  onVolumeChange,
  onPanChange,
  onEnabledChange,
}: OscillatorControlsProps) {
  return (
    <div className={styles.row}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <Switch
        checked={enabled}
        onCheckedChange={onEnabledChange}
        label={label}
        className={styles.oscSwitch}
      />
      <Knob
        value={volume}
        min={0}
        max={1}
        step={0.01}
        label="Volume"
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

function Mixer({
  osc1Volume,
  osc2Volume,
  osc3Volume,
  osc1Pan,
  osc2Pan,
  osc3Pan,
  osc1Enabled,
  osc2Enabled,
  osc3Enabled,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onOsc1PanChange,
  onOsc2PanChange,
  onOsc3PanChange,
  onOsc1EnabledChange,
  onOsc2EnabledChange,
  onOsc3EnabledChange,
}: MixerProps) {
  return (
    <div className={styles.column}>
      <OscillatorControls
        volume={osc1Volume}
        pan={osc1Pan}
        enabled={osc1Enabled}
        label="Osc 1"
        onVolumeChange={onOsc1VolumeChange}
        onPanChange={onOsc1PanChange}
        onEnabledChange={onOsc1EnabledChange}
      />
      <OscillatorControls
        volume={osc2Volume}
        pan={osc2Pan}
        enabled={osc2Enabled}
        label="Osc 2"
        onVolumeChange={onOsc2VolumeChange}
        onPanChange={onOsc2PanChange}
        onEnabledChange={onOsc2EnabledChange}
      />
      <OscillatorControls
        volume={osc3Volume}
        pan={osc3Pan}
        enabled={osc3Enabled}
        label="Osc 3"
        onVolumeChange={onOsc3VolumeChange}
        onPanChange={onOsc3PanChange}
        onEnabledChange={onOsc3EnabledChange}
      />
    </div>
  );
}

export default Mixer;
