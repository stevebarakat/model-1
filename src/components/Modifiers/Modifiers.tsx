import React from "react";
import Knob from "../Knob/Knob";
import ADSR from "../ADSR/ADSR";
import styles from "./Modifiers.module.css";
import {
  Square,
  Triangle,
  AudioWaveform,
  Activity,
  Filter,
} from "lucide-react";
import { WaveformType, LFORouting, FilterType } from "@/synth/types/index";

type ModifiersProps = {
  cutoff: number;
  resonance: number;
  contourAmount: number;
  filterType: FilterType;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTime: number;
  lfoRate: number;
  lfoDepth: number;
  lfoWaveform: WaveformType;
  lfoRouting: LFORouting;
  onCutoffChange: (value: number) => void;
  onResonanceChange: (value: number) => void;
  onContourAmountChange: (value: number) => void;
  onFilterTypeChange: (type: FilterType) => void;
  onAttackTimeChange: (value: number) => void;
  onDecayTimeChange: (value: number) => void;
  onSustainLevelChange: (value: number) => void;
  onReleaseTimeChange: (value: number) => void;
  onLfoRateChange: (value: number) => void;
  onLfoDepthChange: (value: number) => void;
  onLfoWaveformChange: (waveform: WaveformType) => void;
  onLfoRoutingChange: (routing: LFORouting) => void;
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

// Helper function to convert routing to a numeric value
const routingToValue = (routing: LFORouting): number => {
  let value = 0;
  if (routing.filterCutoff) value += 1;
  if (routing.filterResonance) value += 2;
  if (routing.oscillatorPitch) value += 4;
  if (routing.oscillatorVolume) value += 8;
  return value;
};

// Helper function to convert numeric value to routing
const valueToRouting = (value: number): LFORouting => {
  return {
    filterCutoff: (value & 1) !== 0,
    filterResonance: (value & 2) !== 0,
    oscillatorPitch: (value & 4) !== 0,
    oscillatorVolume: (value & 8) !== 0,
  };
};

const filterTypeToValue = (type: FilterType): number => {
  const typeMap: Record<FilterType, number> = {
    lowpass: 0,
    highpass: 1,
    bandpass: 2,
    notch: 3,
  };
  return typeMap[type];
};

const valueToFilterType = (value: number): FilterType => {
  const types: FilterType[] = ["lowpass", "highpass", "bandpass", "notch"];
  const index = Math.round(value);
  return types[Math.max(0, Math.min(types.length - 1, index))];
};

const Modifiers: React.FC<ModifiersProps> = ({
  cutoff,
  resonance,
  contourAmount,
  filterType,
  attackTime,
  decayTime,
  sustainLevel,
  releaseTime,
  lfoRate,
  lfoDepth,
  lfoWaveform,
  lfoRouting,
  onCutoffChange,
  onResonanceChange,
  onContourAmountChange,
  onFilterTypeChange,
  onAttackTimeChange,
  onDecayTimeChange,
  onSustainLevelChange,
  onReleaseTimeChange,
  onLfoRateChange,
  onLfoDepthChange,
  onLfoWaveformChange,
  onLfoRoutingChange,
}) => {
  const routingLabels = [
    "OFF",
    "CUTOFF",
    "RESONANCE",
    "CUT+RES",
    "PITCH",
    "CUT+PITCH",
    "RES+PITCH",
    "CUT+RES +PITCH",
    "VOLUME",
    "CUT+VOL",
    "RES+VOL",
    "CUT+RES +VOL",
    "PITCH+VOL",
    "CUT+PITCH +VOL",
    "RES+PITCH +VOL",
    "ALL",
  ];

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
                value={filterTypeToValue(filterType)}
                min={0}
                max={3}
                step={1}
                label="TYPE"
                valueLabels={{
                  0: "LPF",
                  1: "HPF",
                  2: "BPF",
                  3: "NOTCH",
                }}
                onChange={(value) =>
                  onFilterTypeChange(valueToFilterType(value))
                }
              />
              <Knob
                value={cutoff}
                min={
                  filterType === "bandpass" || filterType === "notch" ? 300 : 20
                }
                max={
                  filterType === "bandpass" || filterType === "notch"
                    ? 3000
                    : 20000
                }
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
                label="RES"
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
                label="ROUTING"
                value={routingToValue(lfoRouting)}
                onChange={(value) => onLfoRoutingChange(valueToRouting(value))}
                min={0}
                max={15}
                step={1}
                valueLabels={routingLabels}
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
