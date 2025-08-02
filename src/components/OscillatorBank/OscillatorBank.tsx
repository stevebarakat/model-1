import Knob from "../Knob";
import {
  OscillatorSettings,
  RangeType,
  OscillatorType,
  OscillatorBankProps,
} from "../../synth/types";
import ArrowKnob from "../ArrowKnob";
import { WAVEFORM_ICONS } from "../Modifiers/constants";
import { useSynthSelectors } from "@/store/synthStore";
import styles from "./OscillatorBank.module.css";

// Constants for mapping values
const RANGE_MAP: Record<RangeType, number> = {
  "32": 0,
  "16": 1,
  "8": 2,
  "4": 3,
  "2": 4,
};

const RANGES: RangeType[] = ["32", "16", "8", "4", "2"];

const WAVEFORM_MAP: Record<OscillatorType, number> = {
  triangle: 0,
  sawtooth: 1,
  square: 2,
  sine: 3,
};

const WAVEFORMS: OscillatorType[] = ["triangle", "sawtooth", "square", "sine"];

// Pure utility functions
function rangeToValue(range: RangeType): number {
  return RANGE_MAP[range];
}

function valueToRange(value: number): RangeType {
  const index = Math.round(value);
  return RANGES[Math.max(0, Math.min(RANGES.length - 1, index))];
}

function waveformToValue(waveform: OscillatorType): number {
  return WAVEFORM_MAP[waveform];
}

function valueToWaveform(value: number): OscillatorType {
  const index = Math.round(value);
  return WAVEFORMS[Math.max(0, Math.min(WAVEFORMS.length - 1, index))];
}

// Optimized individual oscillator component using selectors
function OptimizedOscillatorControls({ id }: { id: 1 | 2 | 3 }) {
  const oscillator = useSynthSelectors.useOscillator(id);
  const setOscillator = useSynthSelectors.useSetOscillator();

  // Safety check for undefined oscillator
  if (!oscillator) {
    return <div>Loading oscillator {id}...</div>;
  }

  const handleChange = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    setOscillator(id, { ...oscillator, [param]: value });
  };

  return (
    <div className={styles.row}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <ArrowKnob
        value={rangeToValue(oscillator.range)}
        min={0}
        max={4}
        step={1}
        valueLabels={{
          0: "32 '",
          1: "16 '",
          2: "8 '",
          3: "4 '",
          4: "2 '",
        }}
        onChange={(value) => handleChange("range", valueToRange(value))}
      />
      <Knob
        size="large"
        value={oscillator.frequency ?? 0}
        min={-12}
        max={12}
        step={0.1}
        label="Freq"
        unit="st"
        onChange={(value) => handleChange("frequency", value)}
      />
      <Knob
        size="large"
        value={oscillator.detune ?? 0}
        min={-50}
        max={50}
        step={1}
        label="Detune"
        unit="ct"
        onChange={(value) => handleChange("detune", value)}
      />
      <ArrowKnob
        value={waveformToValue(oscillator.waveform ?? "sine")}
        min={0}
        max={3}
        step={1}
        valueLabels={WAVEFORM_ICONS}
        onChange={(value) => handleChange("waveform", valueToWaveform(value))}
      />
    </div>
  );
}

// Legacy component for individual oscillator row (kept for backward compatibility)
function OscillatorControls({
  osc,
  onChange,
}: {
  osc: OscillatorSettings;
  onChange: (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => void;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <ArrowKnob
        value={rangeToValue(osc.range)}
        min={0}
        max={4}
        step={1}
        valueLabels={{
          0: "32 '",
          1: "16 '",
          2: "8 '",
          3: "4 '",
          4: "2 '",
        }}
        onChange={(value) => onChange("range", valueToRange(value))}
      />
      <Knob
        size="large"
        value={osc.frequency}
        min={-12}
        max={12}
        step={0.1}
        label="Freq"
        unit="st"
        onChange={(value) => onChange("frequency", value)}
      />
      <Knob
        size="large"
        value={osc.detune}
        min={-50}
        max={50}
        step={1}
        label="Detune"
        unit="ct"
        onChange={(value) => onChange("detune", value)}
      />
      <ArrowKnob
        value={waveformToValue(osc.waveform ?? "sine")}
        min={0}
        max={3}
        step={1}
        valueLabels={WAVEFORM_ICONS}
        onChange={(value) => onChange("waveform", valueToWaveform(value))}
      />
    </div>
  );
}

// Optimized OscillatorBank using individual optimized components
function OptimizedOscillatorBank() {
  return (
    <div>
      <OptimizedOscillatorControls id={1} />
      <OptimizedOscillatorControls id={2} />
      <OptimizedOscillatorControls id={3} />
    </div>
  );
}

// Legacy OscillatorBank component (kept for backward compatibility)
function OscillatorBank({
  osc1,
  osc2,
  osc3,
  onOsc1Change,
  onOsc2Change,
  onOsc3Change,
}: OscillatorBankProps) {
  return (
    <div>
      <OscillatorControls osc={osc1} onChange={onOsc1Change} />
      <OscillatorControls osc={osc2} onChange={onOsc2Change} />
      <OscillatorControls osc={osc3} onChange={onOsc3Change} />
    </div>
  );
}

// Export the optimized version as default
export default OptimizedOscillatorBank;

export type { OscillatorBankProps };
