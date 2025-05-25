import { useEffect, useState, useRef } from "react";
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
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);
  const patternNotesRef = useRef<string[]>([]);

  // Update pattern notes when activeKeys or steps change
  useEffect(() => {
    if (!keyboardRef.synth || !activeKeys) return;

    // Support both string and number for activeKeys
    let rootMidi: number | null = null;
    if (typeof activeKeys === "string") {
      rootMidi = Tone.Frequency(activeKeys).toMidi();
    } else if (typeof activeKeys === "number") {
      rootMidi = activeKeys;
    }

    if (typeof rootMidi !== "number" || isNaN(rootMidi)) {
      console.warn("Invalid root MIDI note from activeKeys:", activeKeys);
      return;
    }

    // Generate pattern notes
    const patternNotes: string[] = [];
    for (const step of steps) {
      const midiNote = rootMidi + step;
      if (typeof midiNote !== "number" || midiNote < 0 || midiNote > 127) {
        console.warn("Skipping invalid MIDI note:", midiNote);
        continue;
      }
      const noteName = Tone.Frequency(midiNote, "midi").toNote();
      if (noteName) patternNotes.push(noteName);
    }

    patternNotesRef.current = patternNotes;
    currentIndexRef.current = 0;
  }, [steps, keyboardRef.synth, activeKeys]);

  // Control arpeggiator playback
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Release any current note
    if (currentNote && keyboardRef.synth) {
      keyboardRef.synth.triggerRelease(currentNote);
      setCurrentNote(null);
    }

    if (
      !activeKeys ||
      !keyboardRef.synth ||
      patternNotesRef.current.length === 0
    ) {
      return;
    }

    // Start new interval
    const playNote = () => {
      if (!keyboardRef.synth) return;

      // Release previous note
      if (currentNote) {
        keyboardRef.synth.triggerRelease(currentNote);
      }

      // Get next note based on mode
      let nextIndex = currentIndexRef.current;
      switch (mode) {
        case "up":
          nextIndex =
            (currentIndexRef.current + 1) % patternNotesRef.current.length;
          break;
        case "down":
          nextIndex =
            (currentIndexRef.current - 1 + patternNotesRef.current.length) %
            patternNotesRef.current.length;
          break;
        case "upDown":
          if (currentIndexRef.current === patternNotesRef.current.length - 1) {
            nextIndex = currentIndexRef.current - 1;
          } else if (currentIndexRef.current === 0) {
            nextIndex = 1;
          } else {
            nextIndex = currentIndexRef.current + 1;
          }
          break;
        case "random":
          nextIndex = Math.floor(
            Math.random() * patternNotesRef.current.length
          );
          break;
      }

      const note = patternNotesRef.current[nextIndex];
      currentIndexRef.current = nextIndex;

      // Play the note
      keyboardRef.synth.triggerAttack(note);
      setCurrentNote(note);

      // Release the note after 80% of the interval
      setTimeout(() => {
        if (currentNote === note) {
          keyboardRef.synth?.triggerRelease(note);
          setCurrentNote(null);
        }
      }, rate * 800);
    };

    // Start the interval
    intervalRef.current = window.setInterval(playNote, rate * 1000);
    playNote(); // Play first note immediately

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (currentNote && keyboardRef.synth) {
        keyboardRef.synth.triggerRelease(currentNote);
        setCurrentNote(null);
      }
    };
  }, [activeKeys, mode, rate, keyboardRef.synth]);

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
