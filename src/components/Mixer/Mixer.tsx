import React from "react";
import * as Switch from "@radix-ui/react-switch";
import Knob from "../Knob/Knob";
import styles from "./Mixer.module.css";

type NoiseType = "white" | "pink";

type MixerProps = {
  osc1Volume: number;
  osc2Volume: number;
  osc3Volume: number;
  noiseVolume: number;
  noiseType: NoiseType;
  modMix: number;
  onModMixChange: (value: number) => void;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onNoiseVolumeChange: (value: number) => void;
  onNoiseTypeChange: (type: NoiseType) => void;
};

const Mixer: React.FC<MixerProps> = ({
  osc1Volume,
  osc2Volume,
  osc3Volume,
  noiseVolume,
  noiseType,
  modMix,
  onModMixChange,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onNoiseVolumeChange,
  onNoiseTypeChange,
}) => {
  return (
    <div className="box">
      <div className={styles.mixer}>
        <div className="controls">
          <div className={styles.volumeContainer}>
            <div className={styles.mixerColumn}>
              <Knob
                value={osc1Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 1"
                onChange={onOsc1VolumeChange}
              />
            </div>
            <div className={styles.mixerColumn}>
              <Knob
                value={osc2Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 2"
                onChange={onOsc2VolumeChange}
              />
            </div>
            <div className={styles.mixerColumn}>
              <Knob
                value={osc3Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 3"
                onChange={onOsc3VolumeChange}
              />
            </div>
          </div>
          <div className={styles.mixerColumn}>
            <Knob
              value={noiseVolume}
              min={0}
              max={1}
              step={0.01}
              label="Noise"
              onChange={onNoiseVolumeChange}
            />
            <div className={styles.noiseSwitch}>
              <div className={styles.switchContainer}>
                <label className={styles.switchLabel}>
                  {noiseType === "white" ? "White" : "Pink"}
                </label>
                <Switch.Root
                  className={styles.switchRoot}
                  checked={noiseType === "pink"}
                  onCheckedChange={(checked) =>
                    onNoiseTypeChange(checked ? "pink" : "white")
                  }
                >
                  <Switch.Thumb className={styles.switchThumb} />
                </Switch.Root>
              </div>
            </div>
            <Knob
              value={modMix}
              min={0}
              max={1}
              step={0.01}
              label="Mod"
              onChange={onModMixChange}
            />
          </div>
        </div>
        <span className="section-title">Mixer</span>
      </div>
    </div>
  );
};

export default Mixer;
