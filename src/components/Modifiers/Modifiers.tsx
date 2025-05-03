import React from "react";
import Knob from "../Knob/Knob";
import ADSR from "../ADSR/ADSR";
import styles from "./Modifiers.module.css";

type ModifiersProps = {
  cutoff: number;
  resonance: number;
  contourAmount: number;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  lfoRate: number;
  lfoDepth: number;
  onCutoffChange: (value: number) => void;
  onResonanceChange: (value: number) => void;
  onContourAmountChange: (value: number) => void;
  onAttackTimeChange: (value: number) => void;
  onDecayTimeChange: (value: number) => void;
  onSustainLevelChange: (value: number) => void;
  onReleaseTimeChange: (value: number) => void;
  onLfoRateChange: (value: number) => void;
  onLfoDepthChange: (value: number) => void;
};

const Modifiers: React.FC<ModifiersProps> = ({
  cutoff,
  resonance,
  contourAmount,
  attackTime,
  decayTime,
  sustainLevel,
  releaseTime,
  lfoRate,
  lfoDepth,
  onCutoffChange,
  onResonanceChange,
  onContourAmountChange,
  onAttackTimeChange,
  onDecayTimeChange,
  onSustainLevelChange,
  onReleaseTimeChange,
  onLfoRateChange,
  onLfoDepthChange,
}) => {
  return (
    <div className={styles.modifiers}>
      <div className={styles.sections}>
        <div className={styles.envelopeSection}>
          <ADSR
            attack={attackTime}
            decay={decayTime}
            sustain={sustainLevel}
            release={releaseTime}
            onAttackChange={onAttackTimeChange}
            onDecayChange={onDecayTimeChange}
            onSustainChange={onSustainLevelChange}
            onReleaseChange={onReleaseTimeChange}
          />
        </div>
        <div className={styles.filterSection}>
          <div className={styles.controls}>
            <Knob
              value={cutoff}
              min={20}
              max={20000}
              step={1}
              label="CUTOFF"
              unit="Hz"
              onChange={onCutoffChange}
            />
            <Knob
              value={resonance}
              min={0}
              max={1}
              step={0.01}
              label="EMPHASIS"
              onChange={onResonanceChange}
            />
            <Knob
              value={contourAmount}
              min={0}
              max={1}
              step={0.01}
              label="CONTOUR"
              onChange={onContourAmountChange}
            />
          </div>
        </div>
        <div className={styles.lfoSection}>
          <div className={styles.controls}>
            <Knob
              value={lfoRate}
              min={0.1}
              max={20}
              step={0.1}
              label="RATE"
              unit="Hz"
              onChange={onLfoRateChange}
            />
            <Knob
              value={lfoDepth}
              min={0}
              max={1}
              step={0.01}
              label="DEPTH"
              onChange={onLfoDepthChange}
            />
          </div>
        </div>
      </div>
      <h3>Modifiers</h3>
    </div>
  );
};

export default Modifiers;
