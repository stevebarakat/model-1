import React from "react";
import Knob from "../Knob/Knob";
import styles from "./ADSR.module.css";

interface ADSRProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
}

const ADSR: React.FC<ADSRProps> = ({
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
}) => {
  return (
    <>
      <div className={styles.controls}>
        <Knob
          value={attack}
          min={0}
          max={2}
          step={0.01}
          label="ATTACK"
          unit="s"
          onChange={onAttackChange}
        />
        <Knob
          value={decay}
          min={0}
          max={2}
          step={0.01}
          label="DECAY"
          unit="s"
          onChange={onDecayChange}
        />
        <Knob
          value={sustain}
          min={0}
          max={1}
          step={0.01}
          label="SUSTAIN"
          onChange={onSustainChange}
        />
        <Knob
          value={release}
          min={0}
          max={4}
          step={0.01}
          label="RELEASE"
          unit="s"
          onChange={onReleaseChange}
        />
      </div>
    </>
  );
};

export default ADSR;
