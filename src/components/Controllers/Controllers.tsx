import React from "react";
import Knob from "../Knob/Knob";
import styles from "./Controllers.module.css";

type ControllersProps = {
  tune: number;
  modMix: number;
  glide: number;
  onTuneChange: (value: number) => void;
  onModMixChange: (value: number) => void;
  onGlideChange: (value: number) => void;
};

const Controllers: React.FC<ControllersProps> = ({
  tune,
  modMix,
  glide,
  onTuneChange,
  onModMixChange,
  onGlideChange,
}) => {
  return (
    <div className="box">
      <div className={styles.controllers}>
        <div className={styles.knobs}>
          <Knob
            value={tune}
            min={-12}
            max={12}
            step={0.1}
            label="TUNE"
            unit="st"
            onChange={onTuneChange}
          />
          <Knob
            value={modMix}
            min={0}
            max={1}
            step={0.01}
            label="MOD MIX"
            onChange={onModMixChange}
          />
          <Knob
            value={glide}
            min={0}
            max={1}
            step={0.01}
            label="GLIDE"
            onChange={onGlideChange}
          />
        </div>
        <span className="section-title">Control</span>
      </div>
    </div>
  );
};

export default Controllers;
