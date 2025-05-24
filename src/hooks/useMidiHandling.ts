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

// Helper function for exponential scaling with linear start
const expScale = (value: number): number => {
  // Convert 0-127 to 0-1 range
  const normalized = value / 127;
  // Use a mix of linear and exponential curves
  // This gives more control in the lower range while still providing exponential response
  const scaled =
    normalized < 0.3
      ? normalized * (1 / 0.3) * 0.3 // Linear scaling for first 30%
      : 0.3 + Math.pow((normalized - 0.3) / 0.7, 1.5) * 0.7; // Exponential for remaining 70%
  return Math.round(scaled * 100);
};

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

  // Store current values to prevent state loss
  const currentPitch = useRef<number>(50); // Center position
  const currentMod = useRef<number | null>(null); // Start as null to indicate uninitialized
  const animationFrameId = useRef<number | undefined>(undefined);
  const pendingUpdates = useRef<{
    pitch?: number;
    mod?: number;
  }>({});
  const lastModUpdate = useRef<number>(0);
  const MOD_UPDATE_INTERVAL = 32; // 32ms between updates (~30fps)

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

  // Process updates in the next animation frame
  const processUpdates = useCallback(() => {
    const now = performance.now();

    if (pendingUpdates.current.pitch !== undefined) {
      setPitchWheel(pendingUpdates.current.pitch);
      currentPitch.current = pendingUpdates.current.pitch;
      pendingUpdates.current.pitch = undefined;
    }

    if (pendingUpdates.current.mod !== undefined) {
      // Only update if enough time has passed since last update
      if (now - lastModUpdate.current >= MOD_UPDATE_INTERVAL) {
        const newModValue = pendingUpdates.current.mod;
        setModWheel(newModValue);
        currentMod.current = newModValue;
        keyboardRef.synth?.updateSettings({ modWheel: newModValue });
        lastModUpdate.current = now;
        pendingUpdates.current.mod = undefined;
      }
    }

    animationFrameId.current = requestAnimationFrame(processUpdates);
  }, [setPitchWheel, setModWheel, keyboardRef]);

  // Start the update loop
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
      let note: string;
      let rawValue: number;

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
              // Queue the update with debouncing
              pendingUpdates.current.mod = expScale(data2);
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
          pendingUpdates.current.pitch = Math.round((rawValue / 16383) * 100);
          break;
      }
    },
    [midiNoteToNote, setActiveKeys, keyboardRef]
  );

  // Initialize with current MIDI values
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

  // Only set initial values if we haven't received MIDI input yet
  useEffect(() => {
    if (currentMod.current === null) {
      // Don't set any initial value - wait for MIDI input
      return;
    }
  }, []);
}
