import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Knob.module.css";

type KnobProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  valueLabels?: Record<number, string | React.ReactElement>;
};

type MousePosition = {
  clientY: number;
};

function getRotation(value: number, min: number, max: number): number {
  const range = max - min;
  const percentage = (value - min) / range;
  return percentage * 300 - 150; // -150 to +150 degrees
}

function getDisplayValue(
  value: number,
  step: number,
  unit: string,
  valueLabels?: Record<number, string | React.ReactElement>
): string | React.ReactElement {
  return (
    valueLabels?.[Math.round(value)] ??
    value.toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "")
  );
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
}: KnobProps): React.ReactElement {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const hasLabel = label !== "";

  const rotation = getRotation(value, min, max);
  const displayValue = getDisplayValue(value, step, unit, valueLabels);
  const ariaValueText =
    typeof displayValue === "string"
      ? displayValue
      : value.toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "");

  function handleMouseDown(e: React.MouseEvent): void {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  }

  const handleMouseMove = useCallback(
    (e: MousePosition): void => {
      const sensitivity = 1.0;
      const deltaY = (startY - e.clientY) * sensitivity;
      const range = max - min;
      const newValue = Math.min(
        max,
        Math.max(min, startValue + (deltaY / 100) * range)
      );
      onChange(Number(newValue.toFixed(1)));
    },
    [min, max, startY, startValue, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!knobRef.current?.contains(document.activeElement)) return;

      const isShiftPressed = e.shiftKey;
      const multiplier = isShiftPressed ? 10 : 1;
      const stepSize = step * multiplier;

      let newValue = value;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          newValue = Math.min(max, value + stepSize);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          newValue = Math.max(min, value - stepSize);
          break;
        default:
          return;
      }

      setIsKeyboardActive(true);
      onChange(Number(newValue.toFixed(2)));
    },
    [value, min, max, step, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseUp(): void {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, startY, startValue, onChange, handleMouseMove]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [value, min, max, step, onChange, handleKeyDown]);

  useEffect(() => {
    if (!isKeyboardActive) return;
    const timer = setTimeout(() => setIsKeyboardActive(false), 1000);
    return () => clearTimeout(timer);
  }, [isKeyboardActive, value]);

  return (
    <div className={styles.knobContainer}>
      {isDragging || isKeyboardActive ? (
        <div className={styles.knobValue}>{displayValue}</div>
      ) : (
        hasLabel && <div className={styles.knobLabel}>{label}</div>
      )}
      <div
        ref={knobRef}
        className={styles.knob}
        style={{ transform: `rotate(${rotation}deg)` }}
        onMouseDown={handleMouseDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        aria-valuetext={ariaValueText}
      />
      <div className={styles.knobGradient} />
    </div>
  );
}

export default Knob;
