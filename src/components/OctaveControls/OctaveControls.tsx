import Knob from "../Knob/Knob";
import styles from "./OctaveControls.module.css";

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
    <div className={styles.octaveControls}>
      <Knob
        value={currentOctave}
        min={1}
        max={7}
        step={1}
        label="Octave"
        labelPosition="left"
        onChange={(newValue: number) => {
          onOctaveChangeStart();
          onOctaveChange(Math.round(newValue));
        }}
        valueLabels={{
          1: "Octave 0-2",
          2: "Octave 1-3",
          3: "Octave 2-4",
          4: "Octave 3-5",
          5: "Octave 4-6",
          6: "Octave 5-7",
          7: "Octave 6-8",
        }}
      />
    </div>
  );
};

export default OctaveControls;
