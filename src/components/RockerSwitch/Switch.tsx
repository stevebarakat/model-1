import "./Switch.css";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
  return (
    <div className="switch switch--dark">
      <label>
        {label && <span className="switch__label">{label}</span>}
        <input
          className="switch__state"
          type="checkbox"
          name="switch"
          onChange={() => onCheckedChange(!checked)}
          checked={checked}
        />
        <span className="switch__control switch__control--rounded"></span>
      </label>
    </div>
  );
}

export default Switch;
