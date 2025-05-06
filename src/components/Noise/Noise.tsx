import Knob from "../Knob";
import Switch from "../Switch";
import styles from "./Noise.module.css";

type NoiseProps = {
  volume: number;
  pan: number;
  type: "white" | "pink";
  tone: number;
  sync: boolean;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onTypeChange: (type: "white" | "pink") => void;
  onToneChange: (value: number) => void;
  onSyncChange: (sync: boolean) => void;
};

function Noise({
  volume,
  pan,
  type,
  tone,
  sync,
  onVolumeChange,
  onPanChange,
  onTypeChange,
  onToneChange,
  onSyncChange,
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
            min={0}
            max={4}
            step={1}
            label="Freq"
            onChange={onToneChange}
            valueLabels={["LOW", "MID LOW", "MID", "MID HIGH", "HIGH"]}
          />
          <div className={styles.noiseTypeToggle}>
            <Switch
              checked={type === "pink"}
              onCheckedChange={(checked) =>
                onTypeChange(checked ? "pink" : "white")
              }
              label={type === "pink" ? "Pink" : "White"}
            />
            <Switch
              checked={sync}
              onCheckedChange={onSyncChange}
              label="Sync"
            />
          </div>
        </div>
        <span className="section-title">Noise</span>
      </div>
    </div>
  );
}

export default Noise;
