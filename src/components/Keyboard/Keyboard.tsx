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
  onMouseDown?: () => void;
  onMouseUp?: () => void;
};

function Keyboard(
  {
    activeKeys = [],
    octaveRange = { min: 3, max: 6 },
    onKeyDown = () => {},
    onKeyUp = () => {},
    onMouseDown = () => {},
    onMouseUp = () => {},
  }: Props,
  ref: React.ForwardedRef<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [synth, setSynth] = useState<Awaited<
    ReturnType<typeof createSynth>
  > | null>(null);

  // Track mouse state for glissando
  const [isMouseDown, setIsMouseDown] = useState(false);

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
      if (!isLoaded) return;
      onKeyDown(note);
    },
    [isLoaded, onKeyDown]
  );

  // Handle key release
  const handleKeyRelease = useCallback(
    (note: string) => {
      if (!isLoaded) return;
      onKeyUp(note);
    },
    [isLoaded, onKeyUp]
  );

  // Handle mouse down on keyboard
  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true);
    onMouseDown();
  }, [onMouseDown]);

  // Handle mouse up on keyboard
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    // Release all active keys
    activeKeys.forEach(onKeyUp);
    onMouseUp();
  }, [activeKeys, onKeyUp, onMouseUp]);

  // Handle mouse leave from keyboard
  const handleMouseLeave = useCallback(() => {
    if (isMouseDown) {
      setIsMouseDown(false);
      // Release all active keys
      activeKeys.forEach(onKeyUp);
      onMouseUp();
    }
  }, [isMouseDown, activeKeys, onKeyUp, onMouseUp]);

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
            onPointerDown={() => {
              handleMouseDown();
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerEnter={() => {
              if (isMouseDown) {
                handleKeyPress(key.note);
              }
            }}
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
            onPointerDown={() => {
              handleMouseDown();
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerEnter={() => {
              if (isMouseDown) {
                handleKeyPress(key.note);
              }
            }}
          />
        );
      });
  }

  return (
    <div
      className={styles.keyboardContainer}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseLeave}
    >
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
