import Knob from "../Knob";

type ReverbProps = {
  amount: number;
  onAmountChange: (value: number) => void;
};

function Reverb({ amount, onAmountChange }: ReverbProps) {
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
}

export default Reverb;
