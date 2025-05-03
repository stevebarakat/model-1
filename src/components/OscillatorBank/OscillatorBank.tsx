import React from "react";
import Knob from "../Knob/Knob";
import styles from "./OscillatorBank.module.css";
import { Square, Triangle, AudioWaveform } from "lucide-react";
import SawtoothWave from "../Icons/SawtoothWave";

type WaveformType = "sine" | "triangle" | "sawtooth" | "square";
type RangeType = "32" | "16" | "8" | "4" | "2";
type OscillatorParam = "frequency" | "waveform" | "range";
type OscillatorParamValue = number | WaveformType | RangeType;

type OscillatorSettings = {
  frequency: number;
  waveform: WaveformType;
  range: RangeType;
};

type OscillatorBankProps = {
  osc1: OscillatorSettings;
  osc2: OscillatorSettings;
  osc3: OscillatorSettings;
  onOsc1Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
  onOsc2Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
  onOsc3Change: (param: OscillatorParam, value: OscillatorParamValue) => void;
};

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

const OscillatorBank: React.FC<OscillatorBankProps> = ({
  osc1,
  osc2,
  osc3,
  onOsc1Change,
  onOsc2Change,
  onOsc3Change,
}) => {
  const renderOscillator = (
    oscNum: number,
    osc: typeof osc1,
    onChange: typeof onOsc1Change
  ) => (
    <>
      <div className={styles.controls}>
        {/* <h4>OSC {oscNum}</h4> */}
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
          value={osc.frequency}
          min={-12}
          max={12}
          step={0.1}
          label="Freq"
          unit="st"
          onChange={(value) => onChange("frequency", value)}
        />
        <Knob
          value={waveformToValue(osc.waveform)}
          min={0}
          max={3}
          step={1}
          label="Wave"
          valueLabels={{
            0: <Triangle size={16} strokeWidth={2} />,
            1: <SawtoothWave size={16} strokeWidth={2} />,
            2: <Square size={16} strokeWidth={2} />,
            3: <AudioWaveform size={16} strokeWidth={2} />,
          }}
          onChange={(value) => onChange("waveform", valueToWaveform(value))}
        />
      </div>
    </>
  );

  return (
    <div className={styles.oscillatorBank}>
      <div className={styles.oscillators}>
        {renderOscillator(1, osc1, onOsc1Change)}
        {renderOscillator(2, osc2, onOsc2Change)}
        {renderOscillator(3, osc3, onOsc3Change)}
      </div>
      <h3>Oscillator Bank</h3>
    </div>
  );
};

export default OscillatorBank;
