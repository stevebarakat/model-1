import { useEffect, useState } from "react";
import * as Tone from "tone";
import styles from "./Arpeggiator.module.css";
import { ArpeggiatorMode } from "@/store/types/synth";
import { useSynthStore } from "@/store/synthStore";

interface ArpeggiatorProps {
  mode: ArpeggiatorMode;
  onModeChange: (mode: ArpeggiatorMode) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  steps: number[];
  onStepsChange: (steps: number[]) => void;
}

const Arpeggiator = ({
  mode,
  onModeChange,
  rate,
  onRateChange,
  steps,
  onStepsChange,
}: ArpeggiatorProps) => {
  const { keyboardRef, activeKeys } = useSynthStore();
  const [pattern, setPattern] = useState<Tone.Pattern<string> | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);

  useEffect(() => {
    if (!keyboardRef.synth || !activeKeys) return;

    // Support both string and number for activeKeys
    let rootMidi: number | null = null;
    if (typeof activeKeys === "string") {
      rootMidi = Tone.Frequency(activeKeys).toMidi();
    } else if (typeof activeKeys === "number") {
      rootMidi = activeKeys;
    } else if (Array.isArray(activeKeys) && activeKeys.length > 0) {
      // Use the first key if it's an array
      if (typeof activeKeys[0] === "string") {
        rootMidi = Tone.Frequency(activeKeys[0]).toMidi();
      } else if (typeof activeKeys[0] === "number") {
        rootMidi = activeKeys[0];
      }
    }

    if (typeof rootMidi !== "number" || isNaN(rootMidi)) {
      console.warn("Invalid root MIDI note from activeKeys:", activeKeys);
      return;
    }

    // Generate pattern notes with logging and guards
    const patternNotes: string[] = steps
      .map((step) => {
        const midiNote = rootMidi! + step;
        if (typeof midiNote !== "number" || midiNote < 0 || midiNote > 127) {
          console.warn("Skipping invalid MIDI note:", midiNote);
          return null;
        }
        const noteName = Tone.Frequency(midiNote, "midi").toNote();
        console.log("Pattern step:", midiNote, noteName);
        return noteName;
      })
      .filter((note) => !!note) as string[];

    if (patternNotes.length === 0) {
      console.warn("No valid pattern notes for arpeggiator.");
      return;
    }

    const newPattern = new Tone.Pattern<string>(
      (time, note) => {
        console.log("Arp note:", note);
        if (note && keyboardRef.synth) {
          if (currentNote) {
            keyboardRef.synth.triggerRelease(currentNote);
          }
          keyboardRef.synth.triggerAttack(note);
          setCurrentNote(note);
        }
      },
      patternNotes,
      mode
    );

    setPattern(newPattern);

    return () => {
      if (currentNote && keyboardRef.synth) {
        keyboardRef.synth.triggerRelease(currentNote);
      }
      newPattern.dispose();
    };
  }, [steps, rate, mode, keyboardRef.synth, activeKeys, currentNote]);

  useEffect(() => {
    if (pattern) {
      if (activeKeys) {
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
  }, [activeKeys, pattern, currentNote, keyboardRef.synth]);

  return (
    <div className={styles.arpeggiator}>
      <div className={styles.controls}>
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
