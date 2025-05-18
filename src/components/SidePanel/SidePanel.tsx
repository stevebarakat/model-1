import ModWheel from "../ModWheel";
import styles from "./SidePanel.module.css";

type ModWheelsProps = {
  pitchWheel: number;
  modWheel: number;
  onPitchWheelChange: (value: number) => void;
  onModWheelChange: (value: number) => void;
  onPitchWheelReset: () => void;
};

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

type SidePanelProps = ModWheelsProps;

function SidePanel(props: SidePanelProps) {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />

      <ModWheels
        pitchWheel={props.pitchWheel}
        modWheel={props.modWheel}
        onPitchWheelChange={props.onPitchWheelChange}
        onModWheelChange={props.onModWheelChange}
        onPitchWheelReset={props.onPitchWheelReset}
      />
      {/* <div className={styles.horizontalIndent} /> */}
    </div>
  );
}

export default SidePanel;
