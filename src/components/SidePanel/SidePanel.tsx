import React from "react";
import ModWheel from "../ModWheel/ModWheel";
import styles from "./SidePanel.module.css";
import OctaveControls from "../OctaveControls/OctaveControls";
import Knob from "../Knob/Knob";

interface SidePanelProps {
  pitchWheel: number;
  modWheel: number;
  onPitchWheelChange: (value: number) => void;
  onModWheelChange: (value: number) => void;
  onPitchWheelReset: () => void;
  glide: number;
  onGlideChange: (value: number) => void;
  currentOctave: number;
  onOctaveChange: (value: number) => void;
  onOctaveChangeStart: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  pitchWheel,
  modWheel,
  onPitchWheelChange,
  onModWheelChange,
  onPitchWheelReset,
  glide,
  onGlideChange,
  currentOctave,
  onOctaveChange,
  onOctaveChangeStart,
}) => {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.topControls}>
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
    </div>
  );
};

export default SidePanel;
