import Knob from "../Knob";
import Switch from "../Switch";
import styles from "./Noise.module.css";

type NoiseProps = {
  volume: number;
  pan?: number;
  type: "white" | "pink";
  tone: number;
  sync: boolean;
  onVolumeChange: (value: number) => void;
  onPanChange?: (value: number) => void;
  onTypeChange: (type: "white" | "pink") => void;
  onToneChange: (value: number) => void;
  onSyncChange: (sync: boolean) => void;
};

function Noise({
  volume,
  type,
  tone,
  sync,
  onVolumeChange,
  onTypeChange,
  onToneChange,
  onSyncChange,
}: NoiseProps) {
  return (
    <div className={styles.column}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <div className={styles.section}>
        <Knob
          size="medium"
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

      <div className={styles.section}>
        <Knob
          size="medium"
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
  );
}

export default Noise;
