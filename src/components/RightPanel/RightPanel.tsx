import Knob from "../Knob";
import ArrowKnob from "../ArrowKnob/ArrowKnob";
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
  const octaveLabels = {
    [-2]: "-2",
    [-1]: "-1",
    0: "0",
    1: "+1",
    2: "+2",
  };

  const handleOctaveChange = (value: number) => {
    onOctaveChange(Math.round(value));
  };

  return (
    <div className={styles.topControls}>
      <ArrowKnob
        value={octave}
        min={-2}
        max={2}
        step={1}
        label="Octave"
        unit=""
        onChange={handleOctaveChange}
        valueLabels={octaveLabels}
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
