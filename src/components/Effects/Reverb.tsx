import Knob from "../Knob";
import styles from "./Effects.module.css";

type ReverbProps = {
  amount: number;
  onAmountChange: (value: number) => void;
};

function Reverb({ amount, onAmountChange }: ReverbProps) {
  return (
    <div className={styles.row}>
      <Knob
        value={amount}
        min={0}
        max={100}
        label="Reverb"
        unit="%"
        onChange={onAmountChange}
      />
    </div>
  );
}

export default Reverb;
