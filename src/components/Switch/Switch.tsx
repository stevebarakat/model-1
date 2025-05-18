import styles from "./Switch.module.css";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <div className={styles.switchContainer}>
      {label && <label className={styles.topLabel}>{label}</label>}
      <button
        className={`${styles.switchRoot} ${className || ""}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
      >
        <div
          className={`${styles.switchThumb} ${checked ? styles.checked : ""}`}
        />
      </button>
    </div>
  );
}

export default Switch;
