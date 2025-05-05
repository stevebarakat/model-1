import Knob from "../Knob";

type OctaveRange = {
  readonly [key: number]: string;
};

const OCTAVE_RANGES: OctaveRange = {
  1: "0 - 2",
  2: "1 - 3",
  3: "2 - 4",
  4: "3 - 5",
  5: "4 - 6",
  6: "5 - 7",
  7: "6 - 8",
} as const;

interface OctaveControlsProps {
  readonly currentOctave: number;
  readonly onOctaveChange: (newOctave: number) => void;
  readonly onOctaveChangeStart: () => void;
}

function OctaveControls({
  currentOctave,
  onOctaveChange,
  onOctaveChangeStart,
}: OctaveControlsProps) {
  const handleOctaveChange = (newValue: number): void => {
    onOctaveChangeStart();
    onOctaveChange(Math.round(newValue));
  };

  return (
    <Knob
      value={currentOctave}
      min={1}
      max={7}
      step={1}
      label="Octave"
      onChange={handleOctaveChange}
      valueLabels={OCTAVE_RANGES}
    />
  );
}

export default OctaveControls;
