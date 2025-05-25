import { presets } from "@/synth/presets";
import styles from "./PresetSelector.module.css";
import { useSynthStore } from "@/store/synthStore";

type PresetSelectorProps = {
  onPresetSelect: (presetName: string) => void;
};

export default function PresetSelector({
  onPresetSelect,
}: PresetSelectorProps) {
  const exportCurrentPreset = useSynthStore((s) => s.exportCurrentPreset);

  const handleExport = () => {
    const preset = exportCurrentPreset();
    const presetString = JSON.stringify(preset, null, 2);
    navigator.clipboard.writeText(presetString);
    alert(
      "Current preset copied to clipboard!\nPaste it into presets.ts as needed."
    );
  };

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
      <button type="button" onClick={handleExport} style={{ marginLeft: 8 }}>
        Export Preset
      </button>
    </div>
  );
}
