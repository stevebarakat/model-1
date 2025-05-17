import Knob from "../Knob";
import ADSR from "../ADSR";
import { WaveformType, LFORouting, FilterType } from "@/synth/types/index";
import { WAVEFORM_ICONS, ROUTING_LABELS } from "./constants.tsx";
import {
  waveformToValue,
  valueToWaveform,
  routingToValue,
  valueToRouting,
  filterTypeToValue,
  valueToFilterType,
} from "./utils";
import ArrowKnob from "../ArrowKnob/ArrowKnob.tsx";
import styles from "./Modifiers.module.css";

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
    <div className="column">
      <div className={styles.row}>
        <div className={styles.screwTopLeft} />
        <div className={styles.screwTopRight} />
        <div className={styles.screwBottomLeft} />
        <div className={styles.screwBottomRight} />
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
      <span className={styles.horizontalIndent}></span>
      <div className={styles.row}>
        <div className={styles.screwTopLeft} />
        <div className={styles.screwTopRight} />
        <div className={styles.screwBottomLeft} />
        <div className={styles.screwBottomRight} />
        <ArrowKnob
          value={filterTypeToValue(filterType)}
          min={0}
          max={3}
          step={1}
          label="Type"
          valueLabels={{
            0: "LPF",
            1: "HPF",
            2: "BPF",
            3: "NOTCH",
          }}
          onChange={(value) => onFilterTypeChange(valueToFilterType(value))}
        />
        <Knob
          value={cutoff}
          min={cutoffMin}
          max={cutoffMax}
          step={1}
          label="Cutoff"
          unit="Hz"
          onChange={onCutoffChange}
        />
        <Knob
          value={resonance}
          min={0}
          max={1}
          step={0.01}
          label="Res"
          onChange={onResonanceChange}
        />
        <Knob
          value={contourAmount}
          min={0}
          max={1}
          step={0.01}
          label="Contour"
          onChange={onContourAmountChange}
        />
      </div>
      <span className={styles.horizontalIndent}></span>
      <div className={styles.row}>
        <div className={styles.screwTopLeft} />
        <div className={styles.screwTopRight} />
        <div className={styles.screwBottomLeft} />
        <div className={styles.screwBottomRight} />
        <Knob
          value={lfoRate}
          min={0.1}
          max={20}
          step={0.1}
          label="Rate"
          unit="Hz"
          onChange={onLfoRateChange}
        />
        <Knob
          label="Routing"
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
          label="Depth"
          onChange={onLfoDepthChange}
        />
        <ArrowKnob
          value={waveformToValue(lfoWaveform)}
          min={0}
          max={3}
          step={1}
          label="Wave"
          valueLabels={WAVEFORM_ICONS}
          onChange={(value) => onLfoWaveformChange(valueToWaveform(value))}
        />
      </div>
      <span className={styles.horizontalIndent}></span>
    </div>
  );
}

export default Modifiers;
