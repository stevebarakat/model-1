import Knob from "../Knob";
import styles from "./Effects.module.css";

type ReverbProps = {
  amount: number;
  decay: number;
  onAmountChange: (value: number) => void;
  onDecayChange: (value: number) => void;
};

function Reverb({ amount, decay, onAmountChange, onDecayChange }: ReverbProps) {
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
      <Knob
        value={decay}
        min={0.1}
        max={5}
        step={0.1}
        label="Decay"
        unit="s"
        onChange={onDecayChange}
      />
    </div>
  );
}

export default Reverb;
