import Knob from "../Knob/Knob";

interface DelayProps {
  amount: number;
  onAmountChange: (value: number) => void;
}

const Delay = ({ amount, onAmountChange }: DelayProps) => {
  return (
    <Knob
      value={amount}
      min={0}
      max={100}
      label="Delay"
      unit="%"
      onChange={onAmountChange}
    />
  );
};

export default Delay;
