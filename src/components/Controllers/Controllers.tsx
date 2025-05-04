import React from "react";
import Knob from "../Knob/Knob";
import styles from "./Controllers.module.css";

type ControllersProps = {
  modMix: number;
  onModMixChange: (value: number) => void;
};

const Controllers: React.FC<ControllersProps> = ({
  modMix,
  onModMixChange,
}) => {
  return (
    <div className="box">
      <div className={styles.controllers}>
        <div className={styles.knobs}>
          <Knob
            value={modMix}
            min={0}
            max={1}
            step={0.01}
            label="Mod Mix"
            onChange={onModMixChange}
          />
        </div>
        <span className="section-title">Control</span>
      </div>
    </div>
  );
};

export default Controllers;
