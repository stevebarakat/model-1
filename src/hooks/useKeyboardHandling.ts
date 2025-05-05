import { useCallback, useState, useEffect } from "react";
import { MutableRefObject } from "react";
import { createSynth } from "../synth/WebAudioSynth";

type Note = string;

interface KeyboardHandlingProps {
  keyboardRef: MutableRefObject<{
    synth: Awaited<ReturnType<typeof createSynth>> | null;
  }>;
  activeKeys: Set<Note>;
  setActiveKeys: (fn: (prev: Set<Note>) => Set<Note>) => void;
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
      setActiveKeys((prev: Set<Note>) => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });

      if (isMouseDown && lastPlayedNote && lastPlayedNote !== note) {
        keyboardRef.current.synth?.handleNoteTransition(lastPlayedNote, note);
      } else {
        keyboardRef.current.synth?.triggerAttack(note);
      }
      setLastPlayedNote(note);
    },
    [setActiveKeys, isMouseDown, lastPlayedNote, keyboardRef]
  );

  const handleKeyUp = useCallback(
    (note: Note) => {
      setActiveKeys((prev: Set<Note>) => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });

      if (!isMouseDown || note === lastPlayedNote) {
        keyboardRef.current.synth?.triggerRelease(note);
        if (note === lastPlayedNote) {
          setLastPlayedNote(null);
        }
      }
    },
    [setActiveKeys, isMouseDown, lastPlayedNote, keyboardRef]
  );

  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    activeKeys.forEach((note) => {
      keyboardRef.current.synth?.triggerRelease(note);
    });
    setLastPlayedNote(null);
  }, [activeKeys, keyboardRef]);

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
        activeKeys.forEach((note) => handleKeyUp(note));
        setCurrentOctave(Math.min(currentOctave + 1, 7));
        return;
      }
      if (e.key === "-" || e.key === "_") {
        activeKeys.forEach((note) => handleKeyUp(note));
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
