import React from "react";
import Mixer, { type MixerProps } from "./Mixer/Mixer";
import OscillatorBank, {
  type OscillatorBankProps,
} from "./OscillatorBank/OscillatorBank";
import styles from "./OscillatorSection.module.css";

// Intersection of MixerProps and OscillatorBankProps
export type OscillatorSectionProps = MixerProps & OscillatorBankProps;

export default function OscillatorSection(props: OscillatorSectionProps) {
  return (
    <div className={styles.combinedContainer}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      <div className={styles.innerContent}>
        <Mixer {...props} />
        <OscillatorBank {...props} />
      </div>
    </div>
  );
}
