import React from "react";
import * as Switch from "@radix-ui/react-switch";
import Knob from "../Knob/Knob";
import styles from "./Mixer.module.css";

type NoiseType = "white" | "pink";

type MixerProps = {
  osc1Volume: number;
  osc2Volume: number;
  osc3Volume: number;
  osc1Pan: number;
  osc2Pan: number;
  osc3Pan: number;
  noiseVolume: number;
  noiseType: NoiseType;
  modMix: number;
  onModMixChange: (value: number) => void;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onOsc1PanChange: (value: number) => void;
  onOsc2PanChange: (value: number) => void;
  onOsc3PanChange: (value: number) => void;
  onNoiseVolumeChange: (value: number) => void;
  onNoiseTypeChange: (type: NoiseType) => void;
};

const Mixer: React.FC<MixerProps> = ({
  osc1Volume,
  osc2Volume,
  osc3Volume,
  osc1Pan,
  osc2Pan,
  osc3Pan,
  noiseVolume,
  noiseType,
  modMix,
  onModMixChange,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onOsc1PanChange,
  onOsc2PanChange,
  onOsc3PanChange,
  onNoiseVolumeChange,
  onNoiseTypeChange,
}) => {
  return (
    <div className="box">
      <div className={styles.mixer}>
        <div className="controls">
          <div className={styles.volumeContainer}>
            <div className={styles.mixerRow}>
              <Knob
                value={osc1Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 1"
                onChange={onOsc1VolumeChange}
              />
              <Knob
                value={osc1Pan}
                min={-1}
                max={1}
                step={0.01}
                label="Pan"
                onChange={onOsc1PanChange}
              />
            </div>
            <div className={styles.mixerRow}>
              <Knob
                value={osc2Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 2"
                onChange={onOsc2VolumeChange}
              />
              <Knob
                value={osc2Pan}
                min={-1}
                max={1}
                step={0.01}
                label="Pan"
                onChange={onOsc2PanChange}
              />
            </div>
            <div className={styles.mixerRow}>
              <Knob
                value={osc3Volume}
                min={0}
                max={1}
                step={0.01}
                label="Osc 3"
                onChange={onOsc3VolumeChange}
              />
              <Knob
                value={osc3Pan}
                min={-1}
                max={1}
                step={0.01}
                label="Pan"
                onChange={onOsc3PanChange}
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
