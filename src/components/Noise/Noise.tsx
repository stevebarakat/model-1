import Knob from "../Knob";
import Switch from "../Switch";
import styles from "./Noise.module.css";

type NoiseProps = {
  volume: number;
  pan: number;
  type: "white" | "pink";
  tone: number;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onTypeChange: (type: "white" | "pink") => void;
  onToneChange: (value: number) => void;
};

function Noise({
  volume,
  pan,
  type,
  tone,
  onVolumeChange,
  onPanChange,
  onTypeChange,
  onToneChange,
}: NoiseProps) {
  return (
    <div className="box">
      <div className="section">
        <div className="row">
          <Knob
            value={volume}
            min={0}
            max={1}
            step={0.01}
            label="Volume"
            onChange={onVolumeChange}
          />
          <Knob
            value={pan}
            min={-1}
            max={1}
            step={0.01}
            label="Pan"
            onChange={onPanChange}
          />
          <Knob
            value={tone}
            min={20}
            max={100}
            step={1}
            label="Tone"
            onChange={onToneChange}
          />
          <div className={styles.noiseTypeToggle}>
            <Switch
              checked={type === "pink"}
              onCheckedChange={(checked) =>
                onTypeChange(checked ? "pink" : "white")
              }
              label="Pink"
            />
          </div>
        </div>
        <span className="section-title">Noise</span>
      </div>
    </div>
  );
}

export default Noise;
