import React from "react";
import Reverb from "./Reverb";
import Delay from "./Delay";
import Distortion from "./Distortion";

type EffectsProps = {
  reverbAmount: number;
  delayAmount: number;
  distortionAmount: number;
  onReverbAmountChange: (amount: number) => void;
  onDelayAmountChange: (amount: number) => void;
  onDistortionAmountChange: (amount: number) => void;
};

function Effects({
  reverbAmount,
  delayAmount,
  distortionAmount,
  onReverbAmountChange,
  onDelayAmountChange,
  onDistortionAmountChange,
}: EffectsProps): React.ReactElement {
  return (
    <div className="box">
      <div className="section">
        <div className="column">
          <Reverb amount={reverbAmount} onAmountChange={onReverbAmountChange} />
          <Delay amount={delayAmount} onAmountChange={onDelayAmountChange} />
          <Distortion
            amount={distortionAmount}
            onAmountChange={onDistortionAmountChange}
          />
        </div>
        <span className="section-title">FX</span>
      </div>
    </div>
  );
}

export default Effects;
