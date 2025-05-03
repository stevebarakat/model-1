import { Plus, Minus } from "lucide-react";
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
      <span className={styles.octaveLabel}>
        Octave {currentOctave - 1} - {currentOctave + 1}
      </span>
      <div className={styles.octaveButtons}>
        <button
          className={styles.octaveButton}
          onClick={() => {
            onOctaveChangeStart();
            onOctaveChange(Math.max(currentOctave - 1, 1));
          }}
        >
          <Minus size={20} />
        </button>
        <button
          className={styles.octaveButton}
          onClick={() => {
            onOctaveChangeStart();
            onOctaveChange(Math.min(currentOctave + 1, 7));
          }}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default OctaveControls;
