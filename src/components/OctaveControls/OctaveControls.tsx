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
  );
};

export default OctaveControls;
