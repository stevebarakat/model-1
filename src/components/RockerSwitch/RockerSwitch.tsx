import "./RockerSwitch.css";

type RockerSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
};

function RockerSwitch({ checked, onCheckedChange, label }: RockerSwitchProps) {
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

export default RockerSwitch;
