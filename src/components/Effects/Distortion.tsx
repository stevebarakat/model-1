import Knob from "../Knob";
import styles from "./Effects.module.css";

type DistortionProps = {
  amount: number;
  lowEQ: number;
  highEQ: number;
  onAmountChange: (value: number) => void;
  onLowEQChange: (value: number) => void;
  onHighEQChange: (value: number) => void;
};

function Distortion({
  amount,
  lowEQ,
  highEQ,
  onAmountChange,
  onLowEQChange,
  onHighEQChange,
}: DistortionProps) {
  return (
    <div className={styles.row}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      {/* <div className={styles.sectionTitle}>Fuzz</div> */}
      <Knob
        value={amount}
        min={0}
        max={100}
        label="Fuzz"
        unit="%"
        onChange={onAmountChange}
      />
      <span className={styles.horizontalIndent}></span>
      <Knob
        value={lowEQ}
        min={0}
        max={100}
        label="Low"
        unit="%"
        onChange={onLowEQChange}
      />
      <span className={styles.horizontalIndent}></span>
      <Knob
        value={highEQ}
        min={0}
        max={100}
        label="High"
        unit="%"
        onChange={onHighEQChange}
      />
    </div>
  );
}

export default Distortion;
