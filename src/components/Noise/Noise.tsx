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
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={styles.column}>
        <div className={styles.screwTopLeft} />
        <div className={styles.screwTopRight} />
        <div className={styles.screwBottomLeft} />
        <div className={styles.screwBottomRight} />
        <div className={styles.row}>
          <Knob
            value={volume}
            min={0}
            max={1}
            step={0.01}
            label="Noise"
            onChange={onVolumeChange}
          />
          <Switch
            checked={type === "pink"}
            onCheckedChange={(checked) =>
              onTypeChange(checked ? "pink" : "white")
            }
            label={type === "pink" ? "Pink" : "White"}
          />
        </div>
        <span className={styles.spacer}></span>
        <div className={styles.row}>
          <Knob
            value={pan}
            min={-1}
            max={1}
            step={0.01}
            label="Pan"
            onChange={onPanChange}
          />
        </div>
        <span className={styles.spacer}></span>
        <div className={styles.row}>
          <Knob
            value={tone}
            min={440}
            max={20000}
            step={1}
            label="Freq"
            onChange={onToneChange}
            logarithmic={true}
          />
          <Switch checked={sync} onCheckedChange={onSyncChange} label="Sync" />
        </div>
      </div>
      <span className={styles.horizontalIndent}></span>
    </div>
  );
}

export default Noise;
