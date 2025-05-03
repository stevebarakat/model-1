import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { createSynth } from "../../synth/WebAudioSynth";
import styles from "./Keyboard.module.css";

type Props = {
  activeKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyDown?: (note: string) => void;
  onKeyUp?: (note: string) => void;
};

function Keyboard(
  {
    activeKeys = [],
    octaveRange = { min: 3, max: 5 },
    onKeyDown = () => {},
    onKeyUp = () => {},
  }: Props,
  ref: React.ForwardedRef<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [synth, setSynth] = useState<Awaited<
    ReturnType<typeof createSynth>
  > | null>(null);

  // Keep track of currently playing notes
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  // Define notes for one octave in order (important for layout)
  const octave = [
    { note: "C", isSharp: false },
    { note: "C#", isSharp: true },
    { note: "D", isSharp: false },
    { note: "D#", isSharp: true },
    { note: "E", isSharp: false },
    { note: "F", isSharp: false },
    { note: "F#", isSharp: true },
    { note: "G", isSharp: false },
    { note: "G#", isSharp: true },
    { note: "A", isSharp: false },
    { note: "A#", isSharp: true },
    { note: "B", isSharp: false },
  ];

  // Create a keyboard with the specified octave range
  const keys: { note: string; isSharp: boolean }[] = [];
  for (let o = octaveRange.min; o <= octaveRange.max; o++) {
    octave.forEach((key) => {
      const note = `${key.note}${o}`;
      keys.push({ note, isSharp: key.isSharp });
    });
  }

  // Handle key press
  const handleKeyPress = useCallback(
    (note: string) => {
      if (!isLoaded || !synth) return;

      // Add to active notes
      setActiveNotes((prev) => {
        const newActiveNotes = new Set(prev);
        newActiveNotes.add(note);
        return newActiveNotes;
      });

      // Trigger attack
      synth.triggerAttack(note);
      onKeyDown(note);
    },
    [isLoaded, synth, onKeyDown]
  );

  // Handle key release
  const handleKeyRelease = useCallback(
    (note: string) => {
      if (!isLoaded || !synth) return;

      // Remove from active notes
      setActiveNotes((prev) => {
        const newActiveNotes = new Set(prev);
        newActiveNotes.delete(note);
        return newActiveNotes;
      });

      // Trigger release
      synth.triggerRelease(note);
      onKeyUp(note);
    },
    [isLoaded, synth, onKeyUp]
  );

  // Release all notes when unmounting or changing instruments
  useEffect(() => {
    return () => {
      if (synth && activeNotes.size > 0) {
        activeNotes.forEach((note) => synth.triggerRelease(note));
        setActiveNotes(new Set());
      }
    };
  }, [synth, activeNotes]);

  // Expose the synth to parent components via ref
  useImperativeHandle(
    ref,
    () => ({
      synth,
    }),
    [synth]
  );

  // Initialize the synth
  useEffect(() => {
    let currentSynth: Awaited<ReturnType<typeof createSynth>> | null = null;

    async function initializeSynth() {
      try {
        currentSynth = await createSynth();
        setSynth(currentSynth);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to initialize synth:", error);
      }
    }

    initializeSynth();

    return () => {
      if (currentSynth) {
        currentSynth.dispose();
      }
    };
  }, []);

  // Render white keys
  function renderWhiteKeys() {
    return keys
      .filter((key) => !key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys.includes(key.note);

        return (
          <div
            key={`white-${key.note}-${index}`}
            className={`${styles.whiteKey} ${
              isActive ? styles.whiteKeyActive : ""
            } `}
            onPointerDown={() => handleKeyPress(key.note)}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerLeave={() => handleKeyRelease(key.note)}
          />
        );
      });
  }

  // Render black keys
  function renderBlackKeys() {
    // Calculate positions for black keys
    const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length; // percentage width

    return keys
      .filter((key) => key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys.includes(key.note);

        // Find the index of this black key in the full keys array
        const keyIndex = keys.findIndex((k) => k.note === key.note);
        // Calculate how many white keys came before this black key
        const whiteKeysBefore = keys
          .slice(0, keyIndex)
          .filter((k) => !k.isSharp).length;
        // Position is based on white keys
        const position = (whiteKeysBefore - 0.3) * whiteKeyWidth;

        return (
          <div
            key={`black-${key.note}-${index}`}
            className={`${styles.blackKey} ${
              isActive ? styles.blackKeyActive : ""
            }`}
            style={{ left: `${position}%`, width: `${whiteKeyWidth * 0.7}%` }}
            onPointerDown={() => handleKeyPress(key.note)}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerLeave={() => handleKeyRelease(key.note)}
          />
        );
      });
  }

  return (
    <div className={styles.keyboardContainer}>
      <div className={styles.keyboard}>
        <div className={styles.pianoKeys}>
          {<div className={styles.leftShadow} />}
          {renderWhiteKeys()}
          {<div className={styles.rightShadow} />}
          {renderBlackKeys()}
        </div>
      </div>
    </div>
  );
}

export default forwardRef(Keyboard);
