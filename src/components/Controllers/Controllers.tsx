import React from "react";
import Knob from "../Knob/Knob";
import styles from "./Controllers.module.css";

type ControllersProps = {
  tune: number;
  modMix: number;
  onTuneChange: (value: number) => void;
  onModMixChange: (value: number) => void;
};

const Controllers: React.FC<ControllersProps> = ({
  tune,
  modMix,
  onTuneChange,
  onModMixChange,
}) => {
  return (
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
      </div>
      <h3>Control</h3>
    </div>
  );
};

export default Controllers;
