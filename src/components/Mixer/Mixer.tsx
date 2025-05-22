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
  osc1Bypassed: boolean;
  osc2Bypassed: boolean;
  osc3Bypassed: boolean;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onOsc1PanChange: (value: number) => void;
  onOsc2PanChange: (value: number) => void;
  onOsc3PanChange: (value: number) => void;
  onOsc1BypassChange: (bypassed: boolean) => void;
  onOsc2BypassChange: (bypassed: boolean) => void;
  onOsc3BypassChange: (bypassed: boolean) => void;
};

type OscillatorControlsProps = {
  volume: number;
  pan: number;
  bypassed: boolean;
  label: string;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onBypassChange: (bypassed: boolean) => void;
  showVolumeLabels?: boolean;
  showPanLabels?: boolean;
};

function OscillatorControls({
  volume,
  pan,
  bypassed,
  label,
  onVolumeChange,
  onPanChange,
  onBypassChange,
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
        checked={!bypassed}
        onCheckedChange={(checked) => onBypassChange(!checked)}
        label="Bypass"
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
  osc1Bypassed,
  osc2Bypassed,
  osc3Bypassed,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onOsc1PanChange,
  onOsc2PanChange,
  onOsc3PanChange,
  onOsc1BypassChange,
  onOsc2BypassChange,
  onOsc3BypassChange,
}: MixerProps) {
  return (
    <div className={styles.column}>
      <OscillatorControls
        volume={osc1Volume}
        pan={osc1Pan}
        bypassed={osc1Bypassed}
        label="Osc 1"
        onVolumeChange={onOsc1VolumeChange}
        onPanChange={onOsc1PanChange}
        onBypassChange={onOsc1BypassChange}
        showVolumeLabels={true}
        showPanLabels={true}
      />
      <OscillatorControls
        volume={osc2Volume}
        pan={osc2Pan}
        bypassed={osc2Bypassed}
        label="Osc 2"
        onVolumeChange={onOsc2VolumeChange}
        onPanChange={onOsc2PanChange}
        onBypassChange={onOsc2BypassChange}
        showVolumeLabels={true}
        showPanLabels={false}
      />
      <OscillatorControls
        volume={osc3Volume}
        pan={osc3Pan}
        bypassed={osc3Bypassed}
        label="Osc 3"
        onVolumeChange={onOsc3VolumeChange}
        onPanChange={onOsc3PanChange}
        onBypassChange={onOsc3BypassChange}
        showVolumeLabels={true}
        showPanLabels={false}
      />
    </div>
  );
}

export default Mixer;
