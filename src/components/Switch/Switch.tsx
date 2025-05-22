import styles from "./Switch.module.css";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  orientation?: "horizontal" | "vertical";
};

function Switch({
  checked,
  onCheckedChange,
  label,
  orientation = "horizontal",
}: SwitchProps) {
  return (
    <div className={`${styles.switchContainer}`}>
      {label && <label className={styles.switchLabel}>{label}</label>}
      <button
        className={`${styles.switchRoot} ${styles[orientation]}`}
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
