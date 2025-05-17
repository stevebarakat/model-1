import { useCallback, useState, useEffect } from "react";
import { MutableRefObject } from "react";
import createSynth from "../synth/WebAudioSynth";

type Note = string;

interface KeyboardHandlingProps {
  keyboardRef: MutableRefObject<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>;
  activeKeys: Note | null;
  setActiveKeys: (
    key: Note | null | ((prev: Note | null) => Note | null)
  ) => void;
  currentOctave: number;
  setCurrentOctave: (octave: number) => void;
}

export function useKeyboardHandling({
  keyboardRef,
  activeKeys,
  setActiveKeys,
  currentOctave,
  setCurrentOctave,
}: KeyboardHandlingProps) {
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleKeyDown = useCallback(
    (note: Note) => {
      // If there's already a note playing, release it first
      if (activeKeys) {
        keyboardRef.current.synth?.triggerRelease(activeKeys);
      }

      setActiveKeys(note);
      keyboardRef.current.synth?.triggerAttack(note);
      setLastPlayedNote(note);
    },
    [setActiveKeys, keyboardRef, activeKeys]
  );

  const handleKeyUp = useCallback(
    (note: Note) => {
      if (note === activeKeys) {
        setActiveKeys(null);
        keyboardRef.current.synth?.triggerRelease(note);
        setLastPlayedNote(null);
      }
    },
    [setActiveKeys, keyboardRef, activeKeys]
  );

  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    if (activeKeys) {
      keyboardRef.current.synth?.triggerRelease(activeKeys);
      setActiveKeys(null);
    }
    setLastPlayedNote(null);
  }, [activeKeys, keyboardRef, setActiveKeys]);

  useEffect(() => {
    const baseKeyboardMap: { [key: string]: string } = {
      a: "C",
      w: "C#",
      s: "D",
      e: "D#",
      d: "E",
      f: "F",
      t: "F#",
      g: "G",
      y: "G#",
      h: "A",
      u: "A#",
      j: "B",
      k: "C+1",
    };

    const handleKeyboardDown = (e: KeyboardEvent) => {
      if (!e.key) return;

      if (e.key === "+" || e.key === "=") {
        if (activeKeys) handleKeyUp(activeKeys);
        setCurrentOctave(Math.min(currentOctave + 1, 7));
        return;
      }
      if (e.key === "-" || e.key === "_") {
        if (activeKeys) handleKeyUp(activeKeys);
        setCurrentOctave(Math.max(currentOctave - 1, 1));
        return;
      }

      const baseNote = baseKeyboardMap[e.key.toLowerCase()];
      if (baseNote && !e.repeat) {
        const note =
          baseNote === "C+1"
            ? `C${currentOctave + 1}`
            : `${baseNote}${currentOctave}`;
        handleKeyDown(note);
      }
    };

    const handleKeyboardUp = (e: KeyboardEvent) => {
      if (!e.key) return;

      const baseNote = baseKeyboardMap[e.key.toLowerCase()];
      if (baseNote) {
        const note =
          baseNote === "C+1"
            ? `C${currentOctave + 1}`
            : `${baseNote}${currentOctave}`;
        handleKeyUp(note);
      }
    };

    window.addEventListener("keydown", handleKeyboardDown);
    window.addEventListener("keyup", handleKeyboardUp);

    return () => {
      window.removeEventListener("keydown", handleKeyboardDown);
      window.removeEventListener("keyup", handleKeyboardUp);
    };
  }, [currentOctave, activeKeys, setCurrentOctave, handleKeyUp, handleKeyDown]);

  return {
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
    handleMouseUp,
  };
}
