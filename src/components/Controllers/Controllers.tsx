import React from "react";
import Knob from "../Knob/Knob";
import styles from "./Controllers.module.css";
import OctaveControls from "../OctaveControls/OctaveControls";

type ControllersProps = {
  modMix: number;
  glide: number;
  onModMixChange: (value: number) => void;
  onGlideChange: (value: number) => void;
  currentOctave: number;
  onOctaveChange: (value: number) => void;
  onOctaveChangeStart: () => void;
};

const Controllers: React.FC<ControllersProps> = ({
  modMix,
  glide,
  onModMixChange,
  onGlideChange,
  currentOctave,
  onOctaveChange,
  onOctaveChangeStart,
}) => {
  return (
    <div className="box">
      <div className={styles.controllers}>
        <div className={styles.knobs}>
          <Knob
            value={glide}
            min={0}
            max={1}
            step={0.01}
            label="Glide"
            onChange={onGlideChange}
          />
          <Knob
            value={modMix}
            min={0}
            max={1}
            step={0.01}
            label="Mod Mix"
            onChange={onModMixChange}
          />
          <div className={styles.octaveControlsRow}>
            <OctaveControls
              currentOctave={currentOctave}
              onOctaveChange={onOctaveChange}
              onOctaveChangeStart={onOctaveChangeStart}
            />
          </div>
        </div>
        <span className="section-title">Control</span>
      </div>
    </div>
  );
};

export default Controllers;
