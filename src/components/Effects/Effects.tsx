import React from "react";
import Reverb from "./Reverb";
import Delay from "./Delay";
import Distortion from "./Distortion";
import { useSynthSelectors } from "@/store/synthStore";
import styles from "./Effects.module.css";

// Optimized Reverb component using selectors
function OptimizedReverb() {
  const reverb = useSynthSelectors.useReverb();
  const updateEffects = useSynthSelectors.useUpdateEffects();

  // Safety check for undefined values
  if (!reverb) {
    return <div>Loading...</div>;
  }

  const handleAmountChange = (amount: number) => {
    updateEffects({ reverb: { ...reverb, amount } });
  };

  const handleDecayChange = (decay: number) => {
    updateEffects({ reverb: { ...reverb, decay } });
  };

  const handleEqChange = (eq: number) => {
    updateEffects({ reverb: { ...reverb, eq } });
  };

  return (
    <Reverb
      amount={reverb.amount ?? 0}
      decay={reverb.decay ?? 1.5}
      eq={reverb.eq ?? 50}
      onAmountChange={handleAmountChange}
      onDecayChange={handleDecayChange}
      onEqChange={handleEqChange}
    />
  );
}

// Optimized Delay component using selectors
function OptimizedDelay() {
  const delay = useSynthSelectors.useDelay();
  const updateEffects = useSynthSelectors.useUpdateEffects();

  // Safety check for undefined values
  if (!delay) {
    return <div>Loading...</div>;
  }

  const handleAmountChange = (amount: number) => {
    updateEffects({ delay: { ...delay, amount } });
  };

  const handleTimeChange = (time: number) => {
    updateEffects({ delay: { ...delay, time } });
  };

  const handleFeedbackChange = (feedback: number) => {
    updateEffects({ delay: { ...delay, feedback } });
  };

  return (
    <Delay
      amount={delay.amount ?? 0}
      delayTime={delay.time ?? 0.3}
      feedback={delay.feedback ?? 13}
      onAmountChange={handleAmountChange}
      onDelayTimeChange={handleTimeChange}
      onFeedbackChange={handleFeedbackChange}
    />
  );
}

// Optimized Distortion component using selectors
function OptimizedDistortion() {
  const distortion = useSynthSelectors.useDistortion();
  const updateEffects = useSynthSelectors.useUpdateEffects();

  // Safety check for undefined values
  if (!distortion) {
    return <div>Loading...</div>;
  }

  const handleAmountChange = (outputGain: number) => {
    updateEffects({ distortion: { ...distortion, outputGain } });
  };

  const handleLowEQChange = (lowEQ: number) => {
    updateEffects({ distortion: { ...distortion, lowEQ } });
  };

  const handleHighEQChange = (highEQ: number) => {
    updateEffects({ distortion: { ...distortion, highEQ } });
  };

  return (
    <Distortion
      amount={distortion.outputGain ?? 0}
      lowEQ={distortion.lowEQ ?? 50}
      highEQ={distortion.highEQ ?? 50}
      onAmountChange={handleAmountChange}
      onLowEQChange={handleLowEQChange}
      onHighEQChange={handleHighEQChange}
    />
  );
}

// Main Effects component using optimized sub-components
function Effects(): React.ReactElement {
  return (
    <div className={styles.column}>
      <OptimizedReverb />
      <span className={styles.horizontalIndent}></span>
      <OptimizedDelay />
      <span className={styles.horizontalIndent}></span>
      <OptimizedDistortion />
      <span className={styles.horizontalIndent}></span>
    </div>
  );
}

export default Effects;
