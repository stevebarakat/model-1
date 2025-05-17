import styles from "./Switch.module.css";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  const isPink = label === "Pink";
  const pinkStyle =
    "linear-gradient(to left, hsl(320deg 70% 45% / 90%), hsl(320deg 70% 35% / 90%))";
  const thumbStyle = {
    background: checked && isPink ? pinkStyle : "",
  };

  return (
    <div className={styles.switchContainer}>
      {label && <label className={styles.switchLabel}>{label}</label>}
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
    </div>
  );
}

export default Switch;
