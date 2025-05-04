export const NOTE_FREQUENCIES: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

export function noteToFrequency(note: string, tune: number = 0): number {
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  const baseFrequency = NOTE_FREQUENCIES[noteName];
  return baseFrequency * Math.pow(2, octave - 4 + tune / 1200);
}

export function getRangeMultiplier(range: string): number {
  const rangeMap: Record<string, number> = {
    "32": 0.125,
    "16": 0.25,
    "8": 0.5,
    "4": 1,
    "2": 2,
  };
  return rangeMap[range] || 1;
}
