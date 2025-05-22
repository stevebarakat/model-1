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
  showVolumeLabels?: boolean;
  showPanLabels?: boolean;
};

function OscillatorControls({
  volume,
  pan,
  enabled,
  label,
  onVolumeChange,
  onPanChange,
  onEnabledChange,
  showVolumeLabels = true,
  showPanLabels = true,
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
        label="On/Off"
        className={styles.oscSwitch}
      />
      <Knob
        value={volume}
        min={0}
        max={1}
        step={0.01}
        label={showVolumeLabels ? label : ""}
        onChange={onVolumeChange}
        displayMode={!showVolumeLabels ? "always" : "replace"}
      />
      <Knob
        value={pan}
        min={-1}
        max={1}
        step={0.01}
        label={showPanLabels ? "Pan" : ""}
        onChange={onPanChange}
        displayMode={!showPanLabels ? "always" : "replace"}
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
        showVolumeLabels={true}
        showPanLabels={true}
      />
      <OscillatorControls
        volume={osc2Volume}
        pan={osc2Pan}
        enabled={osc2Enabled}
        label="Osc 2"
        onVolumeChange={onOsc2VolumeChange}
        onPanChange={onOsc2PanChange}
        onEnabledChange={onOsc2EnabledChange}
        showVolumeLabels={true}
        showPanLabels={false}
      />
      <OscillatorControls
        volume={osc3Volume}
        pan={osc3Pan}
        enabled={osc3Enabled}
        label="Osc 3"
        onVolumeChange={onOsc3VolumeChange}
        onPanChange={onOsc3PanChange}
        onEnabledChange={onOsc3EnabledChange}
        showVolumeLabels={true}
        showPanLabels={false}
      />
    </div>
  );
}

export default Mixer;
