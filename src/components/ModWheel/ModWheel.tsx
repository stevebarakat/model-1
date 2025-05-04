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
        style={{ "--thumb-position": `${percentage}%` } as React.CSSProperties}
      >
        <div className={styles.track}></div>
        <div className={styles.thumb} />
      </div>
      <div className={styles.modLabel}>{label}</div>
    </div>
  );
};

export default ModWheel;
