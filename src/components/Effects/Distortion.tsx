import Knob from "../Knob";

type DistortionProps = {
  amount: number;
  onAmountChange: (value: number) => void;
};

function Distortion({ amount, onAmountChange }: DistortionProps) {
  return (
    <Knob
      value={amount}
      min={0}
      max={100}
      label="Fuzz"
      unit="%"
      onChange={onAmountChange}
    />
  );
}

export default Distortion;
