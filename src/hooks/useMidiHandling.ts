import { useEffect, useCallback } from "react";
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

export function useMidiHandling() {
  const { setActiveKeys, setPitchWheel, setModWheel, keyboardRef } =
    useSynthStore();

  const midiNoteToNote = useCallback((midiNote: number): string => {
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
  }, []);

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const [status, data1, data2] = event.data;
      const messageType = status & 0xf0;
      let normalizedValue: number;
      let note: string;

      switch (messageType) {
        case MIDI_NOTE_ON:
          note = midiNoteToNote(data1);
          if (data2 > 0) {
            // Note on with velocity > 0
            setActiveKeys(note);
            keyboardRef.synth?.triggerAttack(note);
          } else {
            // Note on with velocity = 0 (equivalent to note off)
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
              setModWheel(data2 / 127);
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
          // MIDI pitch bend is 14-bit (0-16383), center at 8192
          normalizedValue = (data1 + (data2 << 7)) / 16383;
          setPitchWheel(normalizedValue);
          break;
      }
    },
    [midiNoteToNote, setActiveKeys, setModWheel, setPitchWheel, keyboardRef]
  );

  useEffect(() => {
    async function setupMidi() {
      try {
        const midiAccess = await navigator.requestMIDIAccess();

        // Handle MIDI inputs
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });

        // Handle new MIDI inputs being connected
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
