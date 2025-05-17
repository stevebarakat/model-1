import React from "react";
import Reverb from "./Reverb";
import Delay from "./Delay";
import Distortion from "./Distortion";
import styles from "./Effects.module.css";

type EffectsProps = {
  reverbAmount: number;
  reverbDecay: number;
  reverbEq: number;
  delayAmount: number;
  delayTime: number;
  delayFeedback: number;
  distortionAmount: number;
  distortionLowEQ: number;
  distortionHighEQ: number;
  onReverbAmountChange: (amount: number) => void;
  onReverbDecayChange: (decay: number) => void;
  onReverbEqChange: (eq: number) => void;
  onDelayAmountChange: (amount: number) => void;
  onDelayTimeChange: (time: number) => void;
  onDelayFeedbackChange: (feedback: number) => void;
  onDistortionAmountChange: (amount: number) => void;
  onDistortionLowEQChange: (value: number) => void;
  onDistortionHighEQChange: (value: number) => void;
};

function Effects({
  reverbAmount,
  reverbDecay,
  reverbEq,
  delayAmount,
  delayTime,
  delayFeedback,
  distortionAmount,
  distortionLowEQ,
  distortionHighEQ,
  onReverbAmountChange,
  onReverbDecayChange,
  onReverbEqChange,
  onDelayAmountChange,
  onDelayTimeChange,
  onDelayFeedbackChange,
  onDistortionAmountChange,
  onDistortionLowEQChange,
  onDistortionHighEQChange,
}: EffectsProps): React.ReactElement {
  return (
    <div className={styles.column}>
      <Reverb
        amount={reverbAmount}
        decay={reverbDecay}
        eq={reverbEq}
        onAmountChange={onReverbAmountChange}
        onDecayChange={onReverbDecayChange}
        onEqChange={onReverbEqChange}
      />
      <span className={styles.horizontalIndent}></span>
      <Delay
        amount={delayAmount}
        delayTime={delayTime}
        feedback={delayFeedback}
        onAmountChange={onDelayAmountChange}
        onDelayTimeChange={onDelayTimeChange}
        onFeedbackChange={onDelayFeedbackChange}
      />
      <span className={styles.horizontalIndent}></span>
      <Distortion
        amount={distortionAmount}
        lowEQ={distortionLowEQ}
        highEQ={distortionHighEQ}
        onAmountChange={onDistortionAmountChange}
        onLowEQChange={onDistortionLowEQChange}
        onHighEQChange={onDistortionHighEQChange}
      />
      <span className={styles.horizontalIndent}></span>
    </div>
  );
}

export default Effects;
