import Knob from "../Knob";
import {
  OscillatorSettings,
  RangeType,
  OscillatorType,
  OscillatorBankProps,
} from "../../synth/types";
import ArrowKnob from "../ArrowKnob";
import { WAVEFORM_ICONS } from "../Modifiers/constants";
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

// Component for individual oscillator row
function OscillatorControls({
  osc,
  onChange,
  showLabels = true,
  oscillatorNumber,
}: {
  osc: OscillatorSettings;
  onChange: (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => void;
  showLabels?: boolean;
  oscillatorNumber: number;
}) {
  return (
    <>
      <div className={styles.row}>
        <div className={styles.oscillatorNumber}>{oscillatorNumber}</div>
        <ArrowKnob
          value={rangeToValue(osc.range)}
          min={0}
          max={4}
          step={1}
          label={showLabels ? "Range" : ""}
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
          label={showLabels ? "Freq" : ""}
          unit={!showLabels ? "st" : ""}
          onChange={(value) => onChange("frequency", value)}
          displayMode={!showLabels ? "always" : "replace"}
        />
        <Knob
          size="large"
          value={osc.detune}
          min={-50}
          max={50}
          step={1}
          label={showLabels ? "Detune" : ""}
          unit={!showLabels ? "ct" : ""}
          onChange={(value) => onChange("detune", value)}
          displayMode={!showLabels ? "always" : "replace"}
        />
        <ArrowKnob
          value={waveformToValue(osc.waveform ?? "sine")}
          min={0}
          max={3}
          step={1}
          label={showLabels ? "Wave" : ""}
          valueLabels={WAVEFORM_ICONS}
          onChange={(value) => onChange("waveform", valueToWaveform(value))}
        />
      </div>
      <span className={styles.horizontalIndent}></span>
    </>
  );
}

function OscillatorBank({
  osc1,
  osc2,
  osc3,
  onOsc1Change,
  onOsc2Change,
  onOsc3Change,
}: OscillatorBankProps) {
  return (
    <div className="bo">
      <div className="secton">
        <div className="colun">
          <OscillatorControls
            osc={osc1}
            onChange={onOsc1Change}
            showLabels={true}
            oscillatorNumber={1}
          />
          <OscillatorControls
            osc={osc2}
            onChange={onOsc2Change}
            showLabels={false}
            oscillatorNumber={2}
          />
          <OscillatorControls
            osc={osc3}
            onChange={onOsc3Change}
            showLabels={false}
            oscillatorNumber={3}
          />
        </div>
        {/* <span className="section-title">Oscillator Bank</span> */}
      </div>
    </div>
  );
}

export default OscillatorBank;
