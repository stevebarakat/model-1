import Knob from "../Knob";
import ModWheel from "../ModWheel";
import OctaveControls from "../OctaveControls";
import styles from "./SidePanel.module.css";

type TopControlsProps = {
  tune: number;
  onTuneChange: (value: number) => void;
  glide: number;
  onGlideChange: (value: number) => void;
  currentOctave: number;
  onOctaveChange: (value: number) => void;
  onOctaveChangeStart: () => void;
};

type ModWheelsProps = {
  pitchWheel: number;
  modWheel: number;
  onPitchWheelChange: (value: number) => void;
  onModWheelChange: (value: number) => void;
  onPitchWheelReset: () => void;
};

function TopControls({
  tune,
  onTuneChange,
  glide,
  onGlideChange,
  currentOctave,
  onOctaveChange,
  onOctaveChangeStart,
}: TopControlsProps) {
  return (
    <div className={styles.topControls}>
      <Knob
        value={tune}
        min={-50}
        max={50}
        step={1}
        label="Tune"
        unit="ct"
        onChange={onTuneChange}
      />
      <Knob
        value={glide}
        min={0}
        max={1}
        step={0.01}
        label="Glide"
        onChange={onGlideChange}
      />
      <OctaveControls
        currentOctave={currentOctave}
        onOctaveChange={onOctaveChange}
        onOctaveChangeStart={onOctaveChangeStart}
      />
    </div>
  );
}

function ModWheels({
  pitchWheel,
  modWheel,
  onPitchWheelChange,
  onModWheelChange,
  onPitchWheelReset,
}: ModWheelsProps) {
  return (
    <div className={styles.modWheels}>
      <div className={styles.modWheelwell}>
        <ModWheel
          value={pitchWheel}
          min={0}
          max={100}
          onChange={onPitchWheelChange}
          onMouseUp={onPitchWheelReset}
          label="Pitch"
        />
      </div>
      <div className={styles.modWheelwell}>
        <ModWheel
          value={modWheel}
          min={0}
          max={100}
          onChange={onModWheelChange}
          label="Mod"
        />
      </div>
    </div>
  );
}

type SidePanelProps = TopControlsProps & ModWheelsProps;

function SidePanel(props: SidePanelProps) {
  return (
    <div className={styles.sidePanel}>
      <TopControls
        tune={props.tune}
        onTuneChange={props.onTuneChange}
        glide={props.glide}
        onGlideChange={props.onGlideChange}
        currentOctave={props.currentOctave}
        onOctaveChange={props.onOctaveChange}
        onOctaveChangeStart={props.onOctaveChangeStart}
      />
      <ModWheels
        pitchWheel={props.pitchWheel}
        modWheel={props.modWheel}
        onPitchWheelChange={props.onPitchWheelChange}
        onModWheelChange={props.onModWheelChange}
        onPitchWheelReset={props.onPitchWheelReset}
      />
    </div>
  );
}

export default SidePanel;
