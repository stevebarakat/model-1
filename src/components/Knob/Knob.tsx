import React, { useEffect, useRef, useState } from "react";
import styles from "./Knob.module.css";

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  valueLabels?: Record<number, string | React.ReactElement>;
  style?: React.CSSProperties;
}

function Knob({
  value,
  min,
  max,
  step = 1,
  label,
  unit = "",
  onChange,
  valueLabels,
  style,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const hasLabel = label !== "";

  // Convert value to rotation degrees (0-300 degrees)
  function getRotation(val: number) {
    const range = max - min;
    const percentage = (val - min) / range;
    return percentage * 300 - 150; // -150 to +150 degrees
  }

  const rotation = getRotation(value);

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  }

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const sensitivity = 0.5;
      const deltaY = (startY - e.clientY) * sensitivity;
      const range = max - min;
      const newValue = Math.min(
        max,
        Math.max(min, startValue + (deltaY / 100) * range)
      );
      onChange(Number(newValue.toFixed(2)));
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, startY, startValue, onChange]);

  const displayValue =
    valueLabels?.[Math.round(value)] ??
    value.toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "");

  return (
    <div className={styles.knobContainer}>
      {isDragging && label !== "Octaves" ? (
        <div className={styles.knobValue}>{displayValue}</div>
      ) : (
        hasLabel &&
        label !== "Octaves" && <div className={styles.knobLabel}>{label}</div>
      )}
      {label === "Octaves" && (
        <div className={styles.knobLabel}>
          {valueLabels?.[Math.round(value)]}
        </div>
      )}
      <div
        ref={knobRef}
        className={styles.knob}
        style={{ transform: `rotate(${rotation}deg)` }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}

export default Knob;
