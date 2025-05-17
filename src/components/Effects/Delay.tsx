import Knob from "../Knob/Knob";
import styles from "./Effects.module.css";

type DelayProps = {
  amount: number;
  onAmountChange: (value: number) => void;
};

function Delay({ amount, onAmountChange }: DelayProps) {
  return (
    <div className={styles.row}>
      <Knob
        value={amount}
        min={0}
        max={100}
        label="Delay"
        unit="%"
        onChange={onAmountChange}
      />
    </div>
  );
}

export default Delay;
