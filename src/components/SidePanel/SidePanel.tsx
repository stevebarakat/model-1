import React from "react";
import ModWheel from "../ModWheel/ModWheel";
import OctaveControls from "../OctaveControls/OctaveControls";
import styles from "./SidePanel.module.css";

interface SidePanelProps {
  pitchWheel: number;
  modWheel: number;
  currentOctave: number;
  onPitchWheelChange: (value: number) => void;
  onModWheelChange: (value: number) => void;
  onPitchWheelReset: () => void;
  onOctaveChange: (octave: number) => void;
  onOctaveChangeStart: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  pitchWheel,
  modWheel,
  currentOctave,
  onPitchWheelChange,
  onModWheelChange,
  onPitchWheelReset,
  onOctaveChange,
  onOctaveChangeStart,
}) => {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.octaveControlsRow}>
        <OctaveControls
          currentOctave={currentOctave}
          onOctaveChange={onOctaveChange}
          onOctaveChangeStart={onOctaveChangeStart}
        />
      </div>
      <div className={styles.modWheels}>
        <div className={styles.modWheelwell}>
          <ModWheel
            value={pitchWheel}
            min={0}
            max={100}
            onChange={onPitchWheelChange}
            onMouseUp={onPitchWheelReset}
            label="PITCH"
          />
        </div>
        <div className={styles.modWheelwell}>
          <ModWheel
            value={modWheel}
            min={0}
            max={100}
            onChange={onModWheelChange}
            label="MOD"
          />
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
