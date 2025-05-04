import React, { useCallback, useRef, useState } from "react";
import styles from "./ModWheel.module.css";

interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onMouseUp?: () => void;
  disabled?: boolean;
  label?: string;
}

const ModWheel: React.FC<RangeSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  onMouseUp,
  disabled = false,
  label = "MOD",
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      // Calculate position from bottom to top since we're rotated 270 degrees
      const y = e.clientY - rect.top;
      const percentage = Math.max(
        0,
        Math.min(100, (1 - y / rect.height) * 100)
      );
      const newValue = min + ((max - min) * percentage) / 100;
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Math.max(min, Math.min(max, steppedValue)));
    },
    [isDragging, min, max, onChange, step]
  );

  // Add keyboard event handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const isShiftPressed = e.shiftKey;
      const multiplier = isShiftPressed ? 10 : 1;
      const stepSize = step * multiplier;

      let newValue = value;

      switch (e.key) {
        case "ArrowUp":
          newValue = Math.min(max, value + stepSize);
          break;
        case "ArrowDown":
          newValue = Math.max(min, value - stepSize);
          break;
        default:
          return;
      }

      onChange(Math.max(min, Math.min(max, newValue)));
    },
    [disabled, max, min, onChange, step, value]
  );

  React.useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      onMouseUp?.();
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, onMouseUp, isDragging]);

  return (
    <div className={styles.modWheelContainer}>
      <div
        ref={sliderRef}
        className={`${styles.slider} ${disabled ? styles.disabled : ""}`}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={{ "--thumb-position": `${percentage}%` } as React.CSSProperties}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className={styles.track}>
          <div className={styles.modWheelShadow}></div>
        </div>
        <div className={styles.thumb} />
      </div>
      <div className={styles.modLabel}>{label}</div>
    </div>
  );
};

export default ModWheel;
