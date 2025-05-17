import Knob from "../Knob/Knob";
import styles from "./Effects.module.css";

type DelayProps = {
  amount: number;
  delayTime: number;
  feedback: number;
  onAmountChange: (value: number) => void;
  onDelayTimeChange: (value: number) => void;
  onFeedbackChange: (value: number) => void;
};

function Delay({
  amount,
  delayTime,
  feedback,
  onAmountChange,
  onDelayTimeChange,
  onFeedbackChange,
}: DelayProps) {
  return (
    <div className={styles.row}>
      <div className={styles.screwTopLeft} />
      <div className={styles.screwTopRight} />
      <div className={styles.screwBottomLeft} />
      <div className={styles.screwBottomRight} />
      {/* <div className={styles.sectionTitle}>Delay</div> */}
      <Knob
        value={amount}
        min={0}
        max={100}
        label="Delay"
        unit="%"
        onChange={onAmountChange}
      />
      <Knob
        value={delayTime}
        min={0.1}
        max={2}
        step={0.1}
        label="Time"
        unit="s"
        onChange={onDelayTimeChange}
      />
      <Knob
        value={feedback}
        min={0}
        max={100}
        label="Feedback"
        unit="%"
        onChange={onFeedbackChange}
      />
    </div>
  );
}

export default Delay;
