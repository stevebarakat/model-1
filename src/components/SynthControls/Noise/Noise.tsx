import React from "react";
import styles from "./Noise.module.css";
import Knob from "../../Knob/Knob";
import Switch from "../../Switch/Switch";

interface NoiseProps {
  volume: number;
  pan: number;
  type: "white" | "pink";
  tone: number;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onTypeChange: (value: "white" | "pink") => void;
  onToneChange: (value: number) => void;
}

const Noise: React.FC<NoiseProps> = ({
  volume,
  pan,
  type,
  tone,
  onVolumeChange,
  onPanChange,
  onTypeChange,
  onToneChange,
}) => {
  return (
    <div className={styles.noise}>
      <h3>Noise</h3>
      <div className={styles.controls}>
        <div className={styles.knob}>
          <Knob
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={1}
            step={0.01}
            label="Volume"
          />
        </div>
        <div className={styles.knob}>
          <Knob
            value={pan}
            onChange={onPanChange}
            min={-1}
            max={1}
            step={0.01}
            label="Pan"
          />
        </div>
        <div className={styles.knob}>
          <Knob
            value={tone}
            onChange={onToneChange}
            min={0}
            max={100}
            step={1}
            label="Tone"
          />
        </div>
        <div className={styles.switch}>
          <Switch
            value={type}
            onChange={onTypeChange}
            options={[
              { label: "White", value: "white" },
              { label: "Pink", value: "pink" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Noise;
