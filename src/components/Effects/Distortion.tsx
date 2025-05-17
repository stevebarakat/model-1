import Knob from "../Knob";
import styles from "./Effects.module.css";

type DistortionProps = {
  amount: number;
  onAmountChange: (value: number) => void;
};

function Distortion({ amount, onAmountChange }: DistortionProps) {
  return (
    <div className={styles.row}>
      <Knob
        value={amount}
        min={0}
        max={100}
        label="Fuzz"
        unit="%"
        onChange={onAmountChange}
      />
    </div>
  );
}

export default Distortion;
