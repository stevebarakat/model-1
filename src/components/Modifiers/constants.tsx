import { WaveformType, FilterType } from "@/synth/types/index";
import { Square, Triangle, AudioWaveform, Activity } from "lucide-react";
import { ReactElement } from "react";

export const WAVEFORM_MAP: Record<WaveformType, number> = {
  triangle: 0,
  sawtooth: 1,
  square: 2,
  sine: 3,
};

export const WAVEFORMS: WaveformType[] = [
  "triangle",
  "sawtooth",
  "square",
  "sine",
];

export const FILTER_TYPE_MAP: Record<FilterType, number> = {
  lowpass: 0,
  highpass: 1,
  bandpass: 2,
  notch: 3,
  allpass: 0,
  highshelf: 0,
  lowshelf: 0,
  peaking: 0,
};

export const FILTER_TYPES: FilterType[] = [
  "lowpass",
  "highpass",
  "bandpass",
  "notch",
];

export const ROUTING_LABELS: Record<number, ReactElement> = {
  0: <span>OFF</span>,
  1: <span>CUTOFF</span>,
  2: <span>RESONANCE</span>,
  3: <span>CUT+RES</span>,
  4: <span>PITCH</span>,
  5: <span>CUT+PITCH</span>,
  6: <span>RES+PITCH</span>,
  7: <span>CUT+RES+PITCH</span>,
  8: <span>VOLUME</span>,
  9: <span>CUT+VOL</span>,
  10: <span>RES+VOL</span>,
  11: <span>CUT+RES+VOL</span>,
  12: <span>PITCH+VOL</span>,
  13: <span>CUT+PITCH+VOL</span>,
  14: <span>RES+PITCH+VOL</span>,
  15: <span>ALL</span>,
};

export const WAVEFORM_ICONS: Record<number, ReactElement> = {
  0: <Triangle size={10} strokeWidth={3} />,
  1: <Activity size={10} strokeWidth={3} />,
  2: <Square size={10} strokeWidth={3} />,
  3: <AudioWaveform size={10} strokeWidth={3} />,
};
