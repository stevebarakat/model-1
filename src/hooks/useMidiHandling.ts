import { useEffect, useCallback, useRef } from "react";
import { useSynthStore } from "../store/synthStore";

// MIDI message types
const MIDI_NOTE_OFF = 0x80;
const MIDI_NOTE_ON = 0x90;
const MIDI_CONTROL_CHANGE = 0xb0;
const MIDI_PITCH_BEND = 0xe0;

// MIDI CC numbers
const CC_MODULATION = 1;
const CC_VOLUME = 7;
const CC_PAN = 10;

type MIDIValue = number;
type NoteName = string;

// Helper function for exponential scaling with linear start
function expScale(value: MIDIValue): MIDIValue {
  const normalized = value / 127;
  const scaled =
    normalized < 0.3
      ? normalized * (1 / 0.3) * 0.3
      : 0.3 + Math.pow((normalized - 0.3) / 0.7, 1.5) * 0.7;
  return Math.round(scaled * 100);
}

// Type definitions for Web MIDI API
interface MIDIMessageEvent {
  data: Uint8Array;
}

interface MIDIPort {
  type: "input" | "output";
  state: "connected" | "disconnected";
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIInput extends MIDIPort {
  type: "input";
}

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((event: { port: MIDIPort }) => void) | null;
}

declare global {
  interface Navigator {
    requestMIDIAccess(): Promise<MIDIAccess>;
  }
}

function midiNoteToNote(midiNote: MIDIValue): NoteName {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${noteNames[noteIndex]}${octave}`;
}

export function useMidiHandling() {
  const { setActiveKeys, setPitchWheel, setModWheel, keyboardRef } =
    useSynthStore();

  const currentPitch = useRef<MIDIValue>(50);
  const currentMod = useRef<MIDIValue>(0);
  const pendingMod = useRef<MIDIValue | null>(null);
  const pendingPitch = useRef<MIDIValue | null>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  const processUpdates = useCallback(() => {
    if (pendingMod.current !== null) {
      setModWheel(pendingMod.current);
      currentMod.current = pendingMod.current;
      keyboardRef.synth?.updateSettings({ modWheel: pendingMod.current });
      pendingMod.current = null;
    }

    if (pendingPitch.current !== null) {
      setPitchWheel(pendingPitch.current);
      currentPitch.current = pendingPitch.current;
      pendingPitch.current = null;
    }

    animationFrameId.current = requestAnimationFrame(processUpdates);
  }, [setModWheel, setPitchWheel, keyboardRef]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(processUpdates);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [processUpdates]);

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const [status, data1, data2] = event.data;
      const messageType = status & 0xf0;
      let note: NoteName;
      let rawValue: MIDIValue;
      let newModValue: MIDIValue;
      let newPitchValue: MIDIValue;

      switch (messageType) {
        case MIDI_NOTE_ON:
          note = midiNoteToNote(data1);
          if (data2 > 0) {
            setActiveKeys(note);
            keyboardRef.synth?.triggerAttack(note);
          } else {
            setActiveKeys(null);
            keyboardRef.synth?.triggerRelease(note);
          }
          break;

        case MIDI_NOTE_OFF:
          note = midiNoteToNote(data1);
          setActiveKeys(null);
          keyboardRef.synth?.triggerRelease(note);
          break;

        case MIDI_CONTROL_CHANGE:
          switch (data1) {
            case CC_MODULATION:
              newModValue = expScale(data2);
              pendingMod.current = newModValue;
              break;
            case CC_VOLUME:
              // Handle volume if needed
              break;
            case CC_PAN:
              // Handle pan if needed
              break;
          }
          break;

        case MIDI_PITCH_BEND:
          rawValue = data1 + (data2 << 7);
          newPitchValue = Math.round((rawValue / 16383) * 100);
          pendingPitch.current = newPitchValue;
          break;
      }
    },
    [setActiveKeys, keyboardRef]
  );

  useEffect(() => {
    async function setupMidi() {
      try {
        const midiAccess = await navigator.requestMIDIAccess();

        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });

        midiAccess.onstatechange = (event) => {
          const port = event.port;
          if (port && port.type === "input" && port.state === "connected") {
            port.onmidimessage = handleMidiMessage;
          }
        };
      } catch (error) {
        console.error("MIDI access error:", error);
      }
    }

    setupMidi();
  }, [handleMidiMessage]);
}
