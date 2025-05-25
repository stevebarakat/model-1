import { useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import styles from "./Arpeggiator.module.css";
import { ArpeggiatorMode } from "@/store/types/synth";
import { useSynthStore } from "@/store/synthStore";
import ArrowKnob from "../ArrowKnob/ArrowKnob";
import Knob from "../Knob/Knob";
import Switch from "../Switch/Switch";
import { ArrowUp, ArrowDown, ArrowUpDown, Shuffle } from "lucide-react";

interface ArpeggiatorProps {
  mode: ArpeggiatorMode;
  onModeChange: (mode: ArpeggiatorMode) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  steps: number[];
  onStepsChange: (steps: number[]) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const MODE_VALUES: Record<number, ArpeggiatorMode> = {
  0: "up",
  1: "down",
  2: "upDown",
  3: "random",
};

const MODE_ICONS: Record<number, React.ReactElement> = {
  0: <ArrowUp size={12} strokeWidth={2} />,
  1: <ArrowDown size={12} strokeWidth={2} />,
  2: <ArrowUpDown size={12} strokeWidth={2} />,
  3: <Shuffle size={12} strokeWidth={2} />,
};

const STEPS_LABELS: Record<number, string> = {
  0: "M",
  1: "m",
  2: "Aug",
  3: "Dim",
  4: "M7",
  5: "m7",
  6: "7",
};

const Arpeggiator = ({
  mode,
  onModeChange,
  rate,
  onRateChange,
  steps,
  onStepsChange,
  enabled,
  onEnabledChange,
}: ArpeggiatorProps) => {
  const { keyboardRef, activeKeys } = useSynthStore();
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);
  const patternNotesRef = useRef<string[]>([]);
  const directionRef = useRef<1 | -1>(1);

  // Convert mode string to number for ArrowKnob
  const modeValue = Object.keys(MODE_VALUES).findIndex(
    (key) => MODE_VALUES[Number(key)] === mode
  );
  console.log("Current mode:", mode, "Mode value:", modeValue);

  // Handle mode change from ArrowKnob
  const handleModeChange = (value: number) => {
    // Ensure we only use integer values
    const intValue = Math.round(value);
    // Ensure value is within bounds
    const boundedValue = Math.max(
      0,
      Math.min(intValue, Object.keys(MODE_VALUES).length - 1)
    );

    const newMode = MODE_VALUES[boundedValue];
    console.log("Mode knob changed:", {
      from: mode,
      to: newMode,
      value: boundedValue,
    });
    onModeChange(newMode);
  };

  // Handle steps change from ArrowKnob
  const handleStepsChange = (value: number) => {
    // Ensure we only use integer values
    const intValue = Math.round(value);
    const presetSteps = [
      [0, 4, 7, 12],
      [0, 3, 7, 12],
      [0, 4, 8, 12],
      [0, 3, 6, 9],
      [0, 4, 7, 11],
      [0, 3, 7, 10],
      [0, 4, 7, 10],
    ];

    // Ensure value is within bounds
    const boundedValue = Math.max(
      0,
      Math.min(intValue, presetSteps.length - 1)
    );

    console.log("Steps knob changed:", {
      from: steps,
      to: presetSteps[boundedValue],
      value: boundedValue,
      label: STEPS_LABELS[boundedValue],
    });

    onStepsChange(presetSteps[boundedValue]);
  };

  // Convert steps array to number for ArrowKnob
  const stepsValue = Object.keys(STEPS_LABELS).findIndex((key) => {
    const presetSteps = [
      [0, 4, 7, 12],
      [0, 3, 7, 12],
      [0, 4, 8, 12],
      [0, 3, 6, 9],
      [0, 4, 7, 11],
      [0, 3, 7, 10],
      [0, 4, 7, 10],
    ];
    // If steps is undefined, default to first preset
    if (!steps) {
      console.log("Steps is undefined, defaulting to first preset");
      return Number(key) === 0;
    }
    const matches =
      JSON.stringify(presetSteps[Number(key)]) === JSON.stringify(steps);
    console.log("Comparing steps:", {
      current: steps,
      preset: presetSteps[Number(key)],
      matches,
      key,
    });
    return matches;
  });

  // Handle rate change
  const handleRateChange = (value: number) => {
    console.log("Rate knob changed:", {
      from: rate,
      to: value,
    });
    onRateChange(value);
  };

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
    directionRef.current = 1; // Reset direction when notes change
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

    // Don't start if not enabled
    if (
      !enabled ||
      !activeKeys ||
      !keyboardRef.synth ||
      patternNotesRef.current.length === 0
    ) {
      return;
    }

    // Play first note immediately
    const firstNote = patternNotesRef.current[0];
    keyboardRef.synth.triggerAttack(firstNote);
    setCurrentNote(firstNote);
    currentIndexRef.current = 0;
    directionRef.current = 1;

    // Schedule first note release
    setTimeout(() => {
      if (currentNote === firstNote) {
        keyboardRef.synth?.triggerRelease(firstNote);
        setCurrentNote(null);
      }
    }, rate * 800);

    // Start new interval
    intervalRef.current = window.setInterval(() => {
      const patternNotes = patternNotesRef.current;
      if (!patternNotes.length) return;

      // Get next note based on mode
      let nextIndex = currentIndexRef.current;
      let randomIndex = 0; // Declare outside case block
      switch (mode) {
        case "up":
          nextIndex = (currentIndexRef.current + 1) % patternNotes.length;
          break;
        case "down":
          nextIndex =
            (currentIndexRef.current - 1 + patternNotes.length) %
            patternNotes.length;
          break;
        case "upDown":
          nextIndex = currentIndexRef.current + directionRef.current;
          // Change direction at ends
          if (nextIndex >= patternNotes.length) {
            nextIndex = patternNotes.length - 2;
            directionRef.current = -1;
          } else if (nextIndex < 0) {
            nextIndex = 1;
            directionRef.current = 1;
          }
          break;
        case "random":
          // Ensure we don't repeat the same note
          do {
            randomIndex = Math.floor(Math.random() * patternNotes.length);
          } while (
            randomIndex === currentIndexRef.current &&
            patternNotes.length > 1
          );
          nextIndex = randomIndex;
          break;
      }
      currentIndexRef.current = nextIndex;

      // Release previous note
      if (currentNote && keyboardRef.synth) {
        keyboardRef.synth.triggerRelease(currentNote);
      }

      // Play new note
      const note = patternNotes[nextIndex];
      if (keyboardRef.synth) {
        keyboardRef.synth.triggerAttack(note);
        setCurrentNote(note);

        // Schedule note release
        setTimeout(() => {
          if (currentNote === note) {
            keyboardRef.synth?.triggerRelease(note);
            setCurrentNote(null);
          }
        }, rate * 800);
      }
    }, rate * 1000);

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
  }, [activeKeys, mode, rate, keyboardRef.synth, enabled]);

  return (
    <div className={styles.arpeggiator}>
      <div className={styles.header}>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          label="Arpeggiator"
        />
      </div>
      <div className={styles.controls}>
        <ArrowKnob
          value={modeValue >= 0 ? modeValue : 0}
          min={0}
          max={3}
          step={1}
          label="Mode"
          onChange={handleModeChange}
          valueLabels={MODE_ICONS}
        />
        <Knob
          value={rate}
          min={0.1}
          max={0.5}
          step={0.05}
          label="Rate"
          unit="s"
          onChange={handleRateChange}
          size="medium"
        />
        <ArrowKnob
          value={stepsValue >= 0 ? stepsValue : 0}
          min={0}
          max={6}
          step={1}
          label="Steps"
          onChange={handleStepsChange}
          valueLabels={STEPS_LABELS}
          arc={180}
        />
      </div>
    </div>
  );
};

export default Arpeggiator;
