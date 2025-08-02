import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Knob.module.css";

type KnobProps = {
  value: number | undefined;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  valueLabels?: Record<number, string | React.ReactElement>;
  logarithmic?: boolean;
  size?: "small" | "medium" | "large";
};

type MousePosition = {
  clientY: number;
  clientX: number;
};

function getRotation(
  value: number,
  min: number,
  max: number,
  logarithmic: boolean
): number {
  const range = max - min;
  let percentage;
  if (logarithmic) {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logValue = Math.log(value);
    percentage = (logValue - logMin) / (logMax - logMin);
  } else {
    percentage = (value - min) / range;
  }
  return percentage * 300 - 150; // -150 to +150 degrees
}

function getDisplayValue(
  value: number | undefined,
  step: number,
  unit: string,
  valueLabels?: Record<number, string | React.ReactElement>
): string | React.ReactElement {
  // Safety check for undefined value
  if (value === undefined || value === null) {
    return "0" + (unit ? ` ${unit}` : "");
  }

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
  logarithmic = false,
  size = "large",
}: KnobProps): React.ReactElement {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  // Safety check for undefined value
  const safeValue = value ?? 0;
  const safeMin = min ?? 0;
  const safeMax = max ?? 100;

  const rotation = getRotation(safeValue, safeMin, safeMax, logarithmic);
  const displayValue = getDisplayValue(safeValue, step, unit, valueLabels);
  const ariaValueText =
    typeof displayValue === "string"
      ? displayValue
      : (safeValue ?? 0).toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "");

  function handleMouseDown(e: React.MouseEvent): void {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(safeValue);
  }

  const handleMouseMove = useCallback(
    (e: MousePosition): void => {
      const sensitivity = 1.0;
      const deltaY = (startY - e.clientY) * sensitivity;
      const range = safeMax - safeMin;
      let newValue;

      if (logarithmic) {
        const logMin = Math.log(safeMin);
        const logMax = Math.log(safeMax);
        const logRange = logMax - logMin;
        const logStartValue = Math.log(startValue);
        const logDelta = (deltaY / 100) * logRange;
        const logNewValue = Math.min(
          logMax,
          Math.max(logMin, logStartValue + logDelta)
        );
        newValue = Math.exp(logNewValue);
      } else {
        newValue = Math.min(
          safeMax,
          Math.max(safeMin, startValue + (deltaY / 100) * range)
        );
      }

      // Round to the nearest step
      const steps = Math.round(newValue / step);
      newValue = steps * step;
      onChange(Number(newValue.toFixed(step >= 1 ? 0 : 2)));
    },
    [safeMin, safeMax, startY, startValue, onChange, logarithmic, step]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (!knobRef.current?.contains(document.activeElement)) return;

      const isShiftPressed = e.shiftKey;
      const multiplier = isShiftPressed ? 10 : 1;
      const stepSize = step * multiplier;

      let newValue = safeValue;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          newValue = Math.min(safeMax, safeValue + stepSize);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          newValue = Math.max(safeMin, safeValue - stepSize);
          break;
        default:
          return;
      }

      // Round to the nearest step
      const steps = Math.round(newValue / step);
      newValue = steps * step;
      onChange(Number(newValue.toFixed(step >= 1 ? 0 : 2)));
    },
    [safeValue, safeMin, safeMax, step, onChange]
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
    <div
      className={`${styles.knobContainer} ${
        styles[`knobContainer${size.charAt(0).toUpperCase() + size.slice(1)}`]
      }`}
    >
      {isDragging || isKeyboardActive ? (
        <div
          className={
            size === "medium" ? styles.knobValueMedium : styles.knobValue
          }
        >
          {displayValue}
        </div>
      ) : (
        <div
          className={
            size === "medium" ? styles.knobLabelMedium : styles.knobLabel
          }
        >
          {label}
        </div>
      )}
      <div className={styles.knob}>
        <div className={styles.knobBtm}>
          <div
            className={styles.outerKnob}
            ref={knobRef}
            style={{ transform: `rotate(${rotation}deg)` }}
            onMouseDown={handleMouseDown}
            tabIndex={0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-label={label}
            aria-valuetext={ariaValueText}
          >
            <div className={styles.innerKnob}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Knob;
