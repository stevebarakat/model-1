import React from "react";
import Knob from "../Knob/Knob";
import ADSR from "../ADSR/ADSR";
import styles from "./Modifiers.module.css";
import { WaveformType } from "../../synth/types";
import { Square, Triangle, AudioWaveform, Activity } from "lucide-react";

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
  lfoWaveform: WaveformType;
  onCutoffChange: (value: number) => void;
  onResonanceChange: (value: number) => void;
  onContourAmountChange: (value: number) => void;
  onAttackTimeChange: (value: number) => void;
  onDecayTimeChange: (value: number) => void;
  onSustainLevelChange: (value: number) => void;
  onReleaseTimeChange: (value: number) => void;
  onLfoRateChange: (value: number) => void;
  onLfoDepthChange: (value: number) => void;
  onLfoWaveformChange: (waveform: WaveformType) => void;
};

const waveformToValue = (waveform: WaveformType): number => {
  const waveformMap: Record<WaveformType, number> = {
    triangle: 0,
    sawtooth: 1,
    square: 2,
    sine: 3,
  };
  return waveformMap[waveform];
};

const valueToWaveform = (value: number): WaveformType => {
  const waveforms: WaveformType[] = ["triangle", "sawtooth", "square", "sine"];
  const index = Math.round(value);
  return waveforms[Math.max(0, Math.min(waveforms.length - 1, index))];
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
  lfoWaveform,
  onCutoffChange,
  onResonanceChange,
  onContourAmountChange,
  onAttackTimeChange,
  onDecayTimeChange,
  onSustainLevelChange,
  onReleaseTimeChange,
  onLfoRateChange,
  onLfoDepthChange,
  onLfoWaveformChange,
}) => {
  return (
    <div className="box">
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
              <Knob
                value={waveformToValue(lfoWaveform)}
                min={0}
                max={3}
                step={1}
                label="WAVE"
                valueLabels={{
                  0: <Triangle size={14} strokeWidth={2} />,
                  1: <Activity size={14} strokeWidth={2} />,
                  2: <Square size={14} strokeWidth={2} />,
                  3: <AudioWaveform size={14} strokeWidth={2} />,
                }}
                onChange={(value) =>
                  onLfoWaveformChange(valueToWaveform(value))
                }
              />
            </div>
          </div>
        </div>
        <span className="section-title">Modifiers</span>
      </div>
    </div>
  );
};

export default Modifiers;
