import React, { useCallback, useMemo } from "react";
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
  // Memoize the controls configuration
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

  // Memoize the handlers
  const handleAttackChange = useCallback(
    (value: number) => {
      onAttackChange(value);
    },
    [onAttackChange]
  );

  const handleDecayChange = useCallback(
    (value: number) => {
      onDecayChange(value);
    },
    [onDecayChange]
  );

  const handleSustainChange = useCallback(
    (value: number) => {
      onSustainChange(value);
    },
    [onSustainChange]
  );

  const handleReleaseChange = useCallback(
    (value: number) => {
      onReleaseChange(value);
    },
    [onReleaseChange]
  );

  // Memoize the handlers map
  const handlers = useMemo(
    () => ({
      attack: handleAttackChange,
      decay: handleDecayChange,
      sustain: handleSustainChange,
      release: handleReleaseChange,
    }),
    [
      handleAttackChange,
      handleDecayChange,
      handleSustainChange,
      handleReleaseChange,
    ]
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
