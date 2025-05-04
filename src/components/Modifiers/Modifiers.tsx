import React from "react";
import Knob from "../Knob/Knob";
import ADSR from "../ADSR/ADSR";
import styles from "./Modifiers.module.css";
import { Square, Triangle, AudioWaveform, Activity } from "lucide-react";
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

const WAVEFORM_MAP: Record<WaveformType, number> = {
  triangle: 0,
  sawtooth: 1,
  square: 2,
  sine: 3,
};

const WAVEFORMS: WaveformType[] = ["triangle", "sawtooth", "square", "sine"];

const FILTER_TYPE_MAP: Record<FilterType, number> = {
  lowpass: 0,
  highpass: 1,
  bandpass: 2,
  notch: 3,
  allpass: 0,
  highshelf: 0,
  lowshelf: 0,
  peaking: 0,
};

const FILTER_TYPES: FilterType[] = ["lowpass", "highpass", "bandpass", "notch"];

const ROUTING_LABELS = [
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

function waveformToValue(waveform: WaveformType): number {
  return WAVEFORM_MAP[waveform];
}

function valueToWaveform(value: number): WaveformType {
  const index = Math.round(value);
  return WAVEFORMS[Math.max(0, Math.min(WAVEFORMS.length - 1, index))];
}

function routingToValue(routing: LFORouting): number {
  let value = 0;
  if (routing.filterCutoff) value += 1;
  if (routing.filterResonance) value += 2;
  if (routing.oscillatorPitch) value += 4;
  if (routing.oscillatorVolume) value += 8;
  return value;
}

function valueToRouting(value: number): LFORouting {
  return {
    filterCutoff: (value & 1) !== 0,
    filterResonance: (value & 2) !== 0,
    oscillatorPitch: (value & 4) !== 0,
    oscillatorVolume: (value & 8) !== 0,
  };
}

function filterTypeToValue(type: FilterType): number {
  return FILTER_TYPE_MAP[type];
}

function valueToFilterType(value: number): FilterType {
  const index = Math.round(value);
  return FILTER_TYPES[Math.max(0, Math.min(FILTER_TYPES.length - 1, index))];
}

function Modifiers({
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
}: ModifiersProps) {
  const isBandpassOrNotch = filterType === "bandpass" || filterType === "notch";
  const cutoffMin = isBandpassOrNotch ? 300 : 20;
  const cutoffMax = isBandpassOrNotch ? 3000 : 20000;

  return (
    <div className="box">
      <div className={styles.modifiers}>
        <div className={styles.sections}>
          <div className={styles.envelopeSection}>
            <div className={styles.controls}>
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
                min={cutoffMin}
                max={cutoffMax}
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
                valueLabels={ROUTING_LABELS}
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
        <span className="section-title">Envelope | Filter | LFO</span>
      </div>
    </div>
  );
}

export default Modifiers;
