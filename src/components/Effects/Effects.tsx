import React from "react";
import Reverb from "./Reverb";
import Delay from "./Delay";
import Distortion from "./Distortion";
import styles from "./Effects.module.css";

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
    <div className={styles.column}>
      <Reverb amount={reverbAmount} onAmountChange={onReverbAmountChange} />
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
