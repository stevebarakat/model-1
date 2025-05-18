import Knob from "../Knob";
import styles from "./RightPanel.module.css";

type TopControlsProps = {
  tune: number;
  onTuneChange: (value: number) => void;
  glide: number;
  onGlideChange: (value: number) => void;
};

function TopControls({
  tune,
  onTuneChange,
  glide,
  onGlideChange,
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
        max={0.5}
        step={0.01}
        label="Glide"
        onChange={onGlideChange}
      />
    </div>
  );
}

type RightPanelProps = TopControlsProps;

function RightPanel(props: RightPanelProps) {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <TopControls
        tune={props.tune}
        onTuneChange={props.onTuneChange}
        glide={props.glide}
        onGlideChange={props.onGlideChange}
      />
      {/* <div className={styles.horizontalIndent} /> */}
    </div>
  );
}

export default RightPanel;
