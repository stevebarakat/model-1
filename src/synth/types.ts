export type FilterType = "lowpass" | "bandpass";

export interface FilterSettings {
  type: FilterType;
  cutoff: number;
  resonance: number;
  envelopeAmount: number;
}
