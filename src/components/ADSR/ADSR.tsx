import React from "react";
import Knob from "../Knob/Knob";

type ADSRValue = {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  unit?: string;
};

type ADSRProps = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
};

type ADSRParam = "attack" | "decay" | "sustain" | "release";

function ADSR({
  attack,
  decay,
  sustain,
  release,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
}: ADSRProps): React.ReactElement {
  const adsrControls: Record<ADSRParam, ADSRValue> = {
    attack: {
      value: attack,
      min: 0,
      max: 2,
      step: 0.01,
      label: "ATTACK",
      unit: "s",
    },
    decay: {
      value: decay,
      min: 0,
      max: 2,
      step: 0.01,
      label: "DECAY",
      unit: "s",
    },
    sustain: {
      value: sustain,
      min: 0,
      max: 1,
      step: 0.01,
      label: "SUSTAIN",
    },
    release: {
      value: release,
      min: 0,
      max: 4,
      step: 0.01,
      label: "RELEASE",
      unit: "s",
    },
  };

  const handleChange = (param: ADSRParam) => (value: number) => {
    const handlers: Record<ADSRParam, (value: number) => void> = {
      attack: onAttackChange,
      decay: onDecayChange,
      sustain: onSustainChange,
      release: onReleaseChange,
    };
    handlers[param](value);
  };

  return (
    <div className="row">
      {Object.entries(adsrControls).map(([param, config]) => (
        <Knob
          key={param}
          {...config}
          onChange={handleChange(param as ADSRParam)}
        />
      ))}
    </div>
  );
}

export default ADSR;
