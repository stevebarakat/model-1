import React from "react";
import Reverb from "./Reverb";
import Delay from "./Delay";
import Distortion from "./Distortion";
import styles from "./Effects.module.css";

type EffectsProps = {
  reverbAmount: number;
  reverbDecay: number;
  delayAmount: number;
  distortionAmount: number;
  onReverbAmountChange: (amount: number) => void;
  onReverbDecayChange: (decay: number) => void;
  onDelayAmountChange: (amount: number) => void;
  onDistortionAmountChange: (amount: number) => void;
};

function Effects({
  reverbAmount,
  reverbDecay,
  delayAmount,
  distortionAmount,
  onReverbAmountChange,
  onReverbDecayChange,
  onDelayAmountChange,
  onDistortionAmountChange,
}: EffectsProps): React.ReactElement {
  return (
    <div className={styles.column}>
      <Reverb
        amount={reverbAmount}
        decay={reverbDecay}
        onAmountChange={onReverbAmountChange}
        onDecayChange={onReverbDecayChange}
      />
      <span className={styles.horizontalIndent}></span>
      <Delay amount={delayAmount} onAmountChange={onDelayAmountChange} />
      <span className={styles.horizontalIndent}></span>
      <Distortion
        amount={distortionAmount}
        onAmountChange={onDistortionAmountChange}
      />
      <span className={styles.horizontalIndent}></span>
    </div>
  );
}

export default Effects;
