import { presets } from "@/synth/presets";
import styles from "./PresetSelector.module.css";

type PresetSelectorProps = {
  onPresetSelect: (presetName: string) => void;
};

export default function PresetSelector({
  onPresetSelect,
}: PresetSelectorProps) {
  return (
    <div className={styles.presetSelector}>
      <select
        onChange={(e) => onPresetSelect(e.target.value)}
        defaultValue=""
        className={styles.select}
      >
        <option value="" disabled>
          Select a preset...
        </option>
        {Object.keys(presets).map((presetName) => (
          <option key={presetName} value={presetName}>
            {presetName}
          </option>
        ))}
      </select>
    </div>
  );
}
