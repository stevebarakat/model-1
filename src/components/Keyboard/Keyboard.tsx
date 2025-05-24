import { useState, useCallback } from "react";
import styles from "./Keyboard.module.css";
import React from "react";

type Note = {
  note: string;
  isSharp: boolean;
};

type Synth = Awaited<
  ReturnType<typeof import("../../synth/WebAudioSynth").createSynth>
> | null;

type KeyboardProps = {
  activeKeys?: string | null;
  octaveRange?: { min: number; max: number };
  onKeyDown?: (note: string) => void;
  onKeyUp?: (note: string) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  synth: Synth;
};

const OCTAVE_NOTES: Note[] = [
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

// Remove useMemo for generateKeyboardKeys
const generateKeyboardKeys = (octaveRange: {
  min: number;
  max: number;
}): Note[] => {
  const keys = Array.from(
    { length: octaveRange.max - octaveRange.min + 1 },
    (_, i) => octaveRange.min + i
  ).flatMap((octave) =>
    OCTAVE_NOTES.map((key) => ({
      note: `${key.note}${octave}`,
      isSharp: key.isSharp,
    }))
  );

  // Add one more key at the end (C of the next octave)
  return [...keys, { note: `C${octaveRange.max + 1}`, isSharp: false }];
};

// Memoize the WhiteKey component
const WhiteKey = React.memo(
  ({
    isActive,
    onPointerDown,
    onPointerUp,
    onPointerEnter,
    onPointerLeave,
  }: {
    isActive: boolean;
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  }) => (
    <div
      className={`${styles.whiteKey} ${isActive ? styles.whiteKeyActive : ""}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    />
  )
);

// Memoize the BlackKey component
const BlackKey = React.memo(
  ({
    isActive,
    position,
    width,
    onPointerDown,
    onPointerUp,
    onPointerEnter,
    onPointerLeave,
  }: {
    isActive: boolean;
    position: number;
    width: number;
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  }) => (
    <div
      className={`${styles.blackKey} ${isActive ? styles.blackKeyActive : ""}`}
      style={{ left: `${position}%`, width: `${width}%` }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    />
  )
);

function Keyboard({
  activeKeys = null,
  octaveRange = { min: 3, max: 6 },
  onKeyDown = () => {},
  onKeyUp = () => {},
  onMouseDown = () => {},
  onMouseUp = () => {},
}: KeyboardProps) {
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Remove useMemo for keys array
  const keys = generateKeyboardKeys(octaveRange);

  // Keep useCallback for event handlers as they're used in dependency arrays
  const handleKeyPress = useCallback(
    (note: string): void => {
      onKeyDown(note);
    },
    [onKeyDown]
  );

  const handleKeyRelease = useCallback(
    (note: string): void => {
      onKeyUp(note);
    },
    [onKeyUp]
  );

  const handleMouseDown = useCallback((): void => {
    setIsMouseDown(true);
    onMouseDown();
  }, [onMouseDown]);

  const handleMouseUp = useCallback((): void => {
    setIsMouseDown(false);
    if (activeKeys) {
      onKeyUp(activeKeys);
    }
    onMouseUp();
  }, [activeKeys, onKeyUp, onMouseUp]);

  const handleMouseLeave = useCallback((): void => {
    if (isMouseDown) {
      setIsMouseDown(false);
      if (activeKeys) {
        onKeyUp(activeKeys);
      }
      onMouseUp();
    }
  }, [isMouseDown, activeKeys, onKeyUp, onMouseUp]);

  const handleKeyInteraction = useCallback(
    (note: string): void => {
      if (isMouseDown) {
        handleKeyPress(note);
      }
    },
    [isMouseDown, handleKeyPress]
  );

  const handleKeyLeave = useCallback(
    (note: string): void => {
      if (isMouseDown) {
        handleKeyRelease(note);
      }
    },
    [isMouseDown, handleKeyRelease]
  );

  // Memoize the white keys render function
  const renderWhiteKeys = useCallback(() => {
    return keys
      .filter((key) => !key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys === key.note;
        return (
          <WhiteKey
            key={`white-${key.note}-${index}`}
            isActive={isActive}
            onPointerDown={() => {
              handleMouseDown();
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerEnter={() => handleKeyInteraction(key.note)}
            onPointerLeave={() => handleKeyLeave(key.note)}
          />
        );
      });
  }, [
    keys,
    activeKeys,
    handleMouseDown,
    handleKeyPress,
    handleKeyRelease,
    handleKeyInteraction,
    handleKeyLeave,
  ]);

  // Memoize the black keys render function
  const renderBlackKeys = useCallback(() => {
    const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length;

    return keys
      .filter((key) => key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys === key.note;
        const keyIndex = keys.findIndex((k) => k.note === key.note);
        const whiteKeysBefore = keys
          .slice(0, keyIndex)
          .filter((k) => !k.isSharp).length;
        const position = (whiteKeysBefore - 0.3) * whiteKeyWidth;

        return (
          <BlackKey
            key={`black-${key.note}-${index}`}
            isActive={isActive}
            position={position}
            width={whiteKeyWidth * 0.7}
            onPointerDown={() => {
              handleMouseDown();
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerEnter={() => handleKeyInteraction(key.note)}
            onPointerLeave={() => handleKeyLeave(key.note)}
          />
        );
      });
  }, [
    keys,
    activeKeys,
    handleMouseDown,
    handleKeyPress,
    handleKeyRelease,
    handleKeyInteraction,
    handleKeyLeave,
  ]);

  return (
    <div
      className={styles.keyboardContainer}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseLeave}
    >
      <div className={styles.keyboard}>
        <div className={styles.pianoKeys}>
          <div className={styles.leftShadow} />
          {renderWhiteKeys()}
          <div className={styles.rightShadow} />
          {renderBlackKeys()}
        </div>
      </div>
    </div>
  );
}

// Remove React.memo from Keyboard component export
export default Keyboard;
