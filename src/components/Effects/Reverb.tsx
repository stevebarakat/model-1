import Knob from "../Knob";
import styles from "./Effects.module.css";

type ReverbProps = {
  amount: number;
  decay: number;
  eq: number;
  onAmountChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onEqChange: (value: number) => void;
};

function Reverb({
  amount,
  decay,
  eq,
  onAmountChange,
  onDecayChange,
  onEqChange,
}: ReverbProps) {
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
      <Knob
        value={eq}
        min={0}
        max={100}
        label="Tone"
        unit="%"
        onChange={onEqChange}
      />
    </div>
  );
}

export default Reverb;
