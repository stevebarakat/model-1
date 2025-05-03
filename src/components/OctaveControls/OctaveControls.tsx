import Knob from "../Knob";

interface OctaveControlsProps {
  currentOctave: number;
  onOctaveChange: (newOctave: number) => void;
  onOctaveChangeStart: () => void;
}

const OctaveControls = ({
  currentOctave,
  onOctaveChange,
  onOctaveChangeStart,
}: OctaveControlsProps) => {
  return (
    <Knob
      value={currentOctave}
      min={1}
      max={7}
      step={1}
      label="Octave"
      onChange={(newValue: number) => {
        onOctaveChangeStart();
        onOctaveChange(Math.round(newValue));
      }}
      valueLabels={{
        1: "0 - 2",
        2: "1 - 3",
        3: "2 - 4",
        4: "3 - 5",
        5: "4 - 6",
        6: "5 - 7",
        7: "6 - 8",
      }}
    />
  );
};

export default OctaveControls;
