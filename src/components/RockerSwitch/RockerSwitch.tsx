import styles from "./RockerSwitch.module.css";

type RockerSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
};

function RockerSwitch({ checked, onCheckedChange, label }: RockerSwitchProps) {
  return (
    <div className={`${styles.switch}`}>
      <label>
        {label && <span className={styles.label}>{label}</span>}
        <input
          className={styles.state}
          type="checkbox"
          name="switch"
          onChange={() => onCheckedChange(!checked)}
          checked={checked}
        />
        <span className={styles.control}></span>
      </label>
    </div>
  );
}

export default RockerSwitch;
