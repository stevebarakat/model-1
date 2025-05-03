import React from "react";
import Knob from "../Knob/Knob";

interface DistortionProps {
  amount: number;
  onAmountChange: (value: number) => void;
}

const Distortion: React.FC<DistortionProps> = ({ amount, onAmountChange }) => {
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
};

export default Distortion;
