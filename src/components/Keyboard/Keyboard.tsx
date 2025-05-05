import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import styles from "./Keyboard.module.css";

type Note = {
  note: string;
  isSharp: boolean;
};

type KeyboardProps = {
  activeKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyDown?: (note: string) => void;
  onKeyUp?: (note: string) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  synth: Awaited<
    ReturnType<typeof import("../../synth/WebAudioSynth").default>
  > | null;
};

type KeyboardRef = {
  synth: Awaited<
    ReturnType<typeof import("../../synth/WebAudioSynth").default>
  > | null;
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

function generateKeyboardKeys(octaveRange: {
  min: number;
  max: number;
}): Note[] {
  const keys: Note[] = [];
  for (let octave = octaveRange.min; octave <= octaveRange.max; octave++) {
    OCTAVE_NOTES.forEach((key) => {
      keys.push({ note: `${key.note}${octave}`, isSharp: key.isSharp });
    });
  }
  return keys;
}

function Keyboard(
  {
    activeKeys = [],
    octaveRange = { min: 3, max: 6 },
    onKeyDown = () => {},
    onKeyUp = () => {},
    onMouseDown = () => {},
    onMouseUp = () => {},
    synth,
  }: KeyboardProps,
  ref: React.ForwardedRef<KeyboardRef>
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const keys = generateKeyboardKeys(octaveRange);

  function handleKeyPress(note: string): void {
    if (!isLoaded) return;
    onKeyDown(note);
  }

  function handleKeyRelease(note: string): void {
    if (!isLoaded) return;
    onKeyUp(note);
  }

  function handleMouseDown(): void {
    setIsMouseDown(true);
    onMouseDown();
  }

  function handleMouseUp(): void {
    setIsMouseDown(false);
    activeKeys.forEach(onKeyUp);
    onMouseUp();
  }

  function handleMouseLeave(): void {
    if (isMouseDown) {
      setIsMouseDown(false);
      activeKeys.forEach(onKeyUp);
      onMouseUp();
    }
  }

  function handleKeyInteraction(note: string): void {
    if (isMouseDown) {
      handleKeyPress(note);
    }
  }

  function handleKeyLeave(note: string): void {
    if (isMouseDown) {
      handleKeyRelease(note);
    }
  }

  useEffect(() => {
    if (synth) {
      setIsLoaded(true);
    }
  }, [synth]);

  useImperativeHandle(
    ref,
    () => ({
      synth,
    }),
    [synth]
  );

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
            }`}
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
  }

  function renderBlackKeys() {
    const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length;

    return keys
      .filter((key) => key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys.includes(key.note);
        const keyIndex = keys.findIndex((k) => k.note === key.note);
        const whiteKeysBefore = keys
          .slice(0, keyIndex)
          .filter((k) => !k.isSharp).length;
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
            onPointerEnter={() => handleKeyInteraction(key.note)}
            onPointerLeave={() => handleKeyLeave(key.note)}
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
          <div className={styles.leftShadow} />
          {renderWhiteKeys()}
          <div className={styles.rightShadow} />
          {renderBlackKeys()}
        </div>
      </div>
    </div>
  );
}

export default forwardRef(Keyboard);
