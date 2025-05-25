import { useEffect, useState } from "react";
import * as Tone from "tone";
import styles from "./Arpeggiator.module.css";
import { ArpeggiatorMode } from "@/store/types/synth";
import { useSynthStore } from "@/store/synthStore";

interface ArpeggiatorProps {
  isActive: boolean;
  onToggle: (enabled: boolean) => void;
  mode: ArpeggiatorMode;
  onModeChange: (mode: ArpeggiatorMode) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  steps: number[];
  onStepsChange: (steps: number[]) => void;
}

const Arpeggiator = ({
  isActive,
  onToggle,
  mode,
  onModeChange,
  rate,
  onRateChange,
  steps,
  onStepsChange,
}: ArpeggiatorProps) => {
  const { keyboardRef } = useSynthStore();
  const [pattern, setPattern] = useState<Tone.Pattern<string> | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);

  useEffect(() => {
    if (!keyboardRef.synth) return;

    // Create the pattern
    const newPattern = new Tone.Pattern<string>(
      (time, note) => {
        if (note && keyboardRef.synth) {
          // Release previous note if exists
          if (currentNote) {
            keyboardRef.synth.triggerRelease(currentNote);
          }
          // Trigger new note
          keyboardRef.synth.triggerAttack(note);
          setCurrentNote(note);
        }
      },
      steps.map((step) => Tone.Frequency(60 + step, "midi").toNote()),
      mode
    );

    setPattern(newPattern);

    return () => {
      if (currentNote && keyboardRef.synth) {
        keyboardRef.synth.triggerRelease(currentNote);
      }
      newPattern.dispose();
    };
  }, [steps, rate, mode, keyboardRef.synth]);

  useEffect(() => {
    if (pattern) {
      if (isActive) {
        Tone.start();
        Tone.Transport.start();
        pattern.start(0);
      } else {
        pattern.stop();
        Tone.Transport.stop();
        if (currentNote && keyboardRef.synth) {
          keyboardRef.synth.triggerRelease(currentNote);
          setCurrentNote(null);
        }
      }
    }
  }, [isActive, pattern, currentNote, keyboardRef.synth]);

  return (
    <div className={styles.arpeggiator}>
      <div className={styles.controls}>
        <button
          className={`${styles.toggleButton} ${isActive ? styles.active : ""}`}
          onClick={() => onToggle(!isActive)}
        >
          {isActive ? "Stop" : "Start"}
        </button>
        <div className={styles.modeControl}>
          <label>Mode:</label>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as ArpeggiatorMode)}
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="upDown">Up/Down</option>
            <option value="random">Random</option>
          </select>
        </div>
        <div className={styles.rateControl}>
          <label>Rate:</label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={rate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
          />
          <span>{rate.toFixed(2)}s</span>
        </div>
        <div className={styles.stepsControl}>
          <label>Steps:</label>
          <select
            value={JSON.stringify(steps)}
            onChange={(e) => onStepsChange(JSON.parse(e.target.value))}
          >
            <option value={JSON.stringify([0, 4, 7, 12])}>Major</option>
            <option value={JSON.stringify([0, 3, 7, 12])}>Minor</option>
            <option value={JSON.stringify([0, 4, 8, 12])}>Augmented</option>
            <option value={JSON.stringify([0, 3, 6, 9])}>Diminished</option>
            <option value={JSON.stringify([0, 2, 4, 6, 8, 10])}>
              Whole Tone
            </option>
            <option value={JSON.stringify([0, 4, 7, 11])}>Major 7th</option>
            <option value={JSON.stringify([0, 3, 7, 10])}>Minor 7th</option>
            <option value={JSON.stringify([0, 4, 7, 10])}>Dominant 7th</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Arpeggiator;
