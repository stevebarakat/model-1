import React from "react";
import Knob from "../Knob/Knob";
import styles from "./OscillatorBank.module.css";
import { Square, Triangle, AudioWaveform, Activity } from "lucide-react";
import {
  OscillatorSettings,
  RangeType,
  OscillatorType,
  OscillatorBankProps,
} from "../../synth/types";

// Helper functions to convert between numeric values and discrete options
const rangeToValue = (range: RangeType): number => {
  const rangeMap: Record<RangeType, number> = {
    "32": 0,
    "16": 1,
    "8": 2,
    "4": 3,
    "2": 4,
  };
  return rangeMap[range];
};

const valueToRange = (value: number): RangeType => {
  const ranges: RangeType[] = ["32", "16", "8", "4", "2"];
  const index = Math.round(value);
  return ranges[Math.max(0, Math.min(ranges.length - 1, index))];
};

const waveformToValue = (waveform: OscillatorType): number => {
  const waveformMap: Record<OscillatorType, number> = {
    triangle: 0,
    sawtooth: 1,
    square: 2,
    sine: 3,
  };
  return waveformMap[waveform];
};

const valueToWaveform = (value: number): OscillatorType => {
  const waveforms: OscillatorType[] = [
    "triangle",
    "sawtooth",
    "square",
    "sine",
  ];
  const index = Math.round(value);
  return waveforms[Math.max(0, Math.min(waveforms.length - 1, index))];
};

const OscillatorBank: React.FC<OscillatorBankProps> = ({
  osc1,
  osc2,
  osc3,
  onOsc1Change,
  onOsc2Change,
  onOsc3Change,
}) => {
  const renderOscillator = (
    osc: OscillatorSettings,
    onChange: (
      param: keyof OscillatorSettings,
      value: OscillatorSettings[keyof OscillatorSettings]
    ) => void
  ) => (
    <>
      <div className="controls">
        <Knob
          value={rangeToValue(osc.range)}
          min={0}
          max={4}
          step={1}
          label="Range"
          unit="'"
          valueLabels={{
            0: "32",
            1: "16",
            2: "8",
            3: "4",
            4: "2",
          }}
          onChange={(value) => onChange("range", valueToRange(value))}
        />
        <Knob
          value={waveformToValue(osc.waveform)}
          min={0}
          max={3}
          step={1}
          label="Wave"
          valueLabels={{
            0: <AudioWaveform size={14} strokeWidth={2} />,
            1: <Square size={14} strokeWidth={2} />,
            2: <Activity size={14} strokeWidth={2} />,
            3: <Triangle size={14} strokeWidth={2} />,
          }}
          onChange={(value) => onChange("waveform", valueToWaveform(value))}
        />
        <Knob
          value={osc.frequency}
          min={-12}
          max={12}
          step={0.1}
          label="Freq"
          unit="st"
          onChange={(value) => onChange("frequency", value)}
        />
        <Knob
          value={osc.detune}
          min={-50}
          max={50}
          step={1}
          label="Detune"
          unit="ct"
          onChange={(value) => onChange("detune", value)}
        />
        <Knob
          value={osc.pan ?? 0}
          min={-1}
          max={1}
          step={0.01}
          label="Pan"
          onChange={(value) => onChange("pan", value)}
        />
      </div>
    </>
  );

  return (
    <div className={styles.oscillatorBank}>
      <div className={styles.oscillators}>
        {renderOscillator(osc1, onOsc1Change)}
        {renderOscillator(osc2, onOsc2Change)}
        {renderOscillator(osc3, onOsc3Change)}
      </div>
      <span className="section-title">Oscillator Bank</span>
    </div>
  );
};

export default OscillatorBank;
