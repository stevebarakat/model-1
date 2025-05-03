import Knob from "../Knob/Knob";

interface ReverbProps {
  amount: number;
  onAmountChange: (value: number) => void;
}

const Reverb = ({ amount, onAmountChange }: ReverbProps) => {
  return (
    <Knob
      value={amount}
      min={0}
      max={100}
      label="Reverb"
      unit="%"
      onChange={onAmountChange}
    />
  );
};

export default Reverb;
