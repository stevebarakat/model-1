import styles from "./Switch.module.css";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  topLabel?: string;
  bottomLabel?: string;
  className?: string;
};

function Switch({
  checked,
  onCheckedChange,
  topLabel,
  bottomLabel,
  className,
}: SwitchProps) {
  const isPink = topLabel === "Pink";
  const pinkStyle =
    "linear-gradient(to left, hsl(320deg 70% 45% / 90%), hsl(320deg 70% 35% / 90%))";
  const thumbStyle = {
    background: checked && isPink ? pinkStyle : "",
  };

  return (
    <div className={styles.switchContainer}>
      {topLabel && <label className={styles.topLabel}>{topLabel}</label>}
      <button
        className={`${styles.switchRoot} ${className || ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
      >
        <div
          className={`${styles.switchThumb} ${checked ? styles.checked : ""}`}
          style={thumbStyle}
        />
      </button>
      {bottomLabel && (
        <label className={styles.bottomLabel}>{bottomLabel}</label>
      )}
    </div>
  );
}

export default Switch;
