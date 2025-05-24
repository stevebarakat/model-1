import React, { useMemo } from "react";
import Knob from "../Knob/Knob";
import styles from "../Modifiers/Modifiers.module.css";

type ADSRValue = {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
};

type ADSRProps = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
};

type ADSRParam = "attack" | "decay" | "sustain" | "release";

const ADSR = React.memo(function ADSR({
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
}: ADSRProps): React.ReactElement {
  const adsrControls = useMemo<Record<ADSRParam, ADSRValue>>(
    () => ({
      attack: {
        value: attack,
        min: 0,
        max: 2,
        step: 0.01,
        label: "ATTACK",
        unit: "s",
      },
      decay: {
        value: decay,
        min: 0,
        max: 2,
        step: 0.01,
        label: "DECAY",
        unit: "s",
      },
      sustain: {
        value: sustain,
        min: 0,
        max: 1,
        step: 0.01,
        label: "SUSTAIN",
      },
      release: {
        value: release,
        min: 0,
        max: 4,
        step: 0.01,
        label: "RELEASE",
        unit: "s",
      },
    }),
    [attack, decay, sustain, release]
  );

  const handlers = useMemo(
    () => ({
      attack: onAttackChange,
      decay: onDecayChange,
      sustain: onSustainChange,
      release: onReleaseChange,
    }),
    [onAttackChange, onDecayChange, onSustainChange, onReleaseChange]
  );

  return (
    <div className={styles.innerRow}>
      {Object.entries(adsrControls).map(([param, config]) => (
        <Knob key={param} {...config} onChange={handlers[param as ADSRParam]} />
      ))}
    </div>
  );
});

export default ADSR;
