import React, { useState } from "react";
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
  const [power, setPower] = useState(false);

  return (
    <div className="box">
      <div className={styles.controllers}>
        <div
          onClick={() => setPower(!power)}
          className={`${styles.powerSwitch} ${power ? styles.on : styles.off}`}
        >
          <span className={styles.on}>1</span>
          <span className={styles.off}>0</span>
        </div>
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
