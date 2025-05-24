import Knob from "../Knob";
import styles from "./RightPanel.module.css";

type TopControlsProps = {
  octave: number;
  onOctaveChange: (value: number) => void;
  glide: number;
  onGlideChange: (value: number) => void;
};

function TopControls({
  octave,
  onOctaveChange,
  glide,
  onGlideChange,
}: TopControlsProps) {
  return (
    <div className={styles.topControls}>
      <Knob
        value={octave}
        min={-2}
        max={2}
        step={1}
        label="Octave"
        unit=""
        onChange={onOctaveChange}
      />
      <Knob
        value={glide}
        min={0}
        max={10}
        step={0.1}
        label="Glide"
        onChange={onGlideChange}
      />
    </div>
  );
}

type RightPanelProps = TopControlsProps;

function RightPanel(props: RightPanelProps) {
  return (
    <div className={styles.rightPanel}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <TopControls
        octave={props.octave}
        onOctaveChange={props.onOctaveChange}
        glide={props.glide}
        onGlideChange={props.onGlideChange}
      />
      {/* <div className={styles.horizontalIndent} /> */}
    </div>
  );
}

export default RightPanel;
