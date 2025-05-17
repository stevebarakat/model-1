import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./ArrowKnob.module.css";

type ArrowKnobProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  label?: string;
  unit?: string;
  onChange: (value: number) => void;
  valueLabels: Record<number, string | React.ReactElement>;
};

type MousePosition = {
  clientY: number;
  clientX: number;
};

function getRotation(value: number, min: number, max: number): number {
  const range = max - min;
  const percentage = (value - min) / range;
  return percentage * 120 - 60; // -60 to +60 degrees (top 120° arc)
}

function getDisplayValue(
  value: number,
  step: number,
  unit: string,
  valueLabels?: Record<number, string | React.ReactElement>
): string | React.ReactElement {
  if (value === undefined) return "";
  return (
    valueLabels?.[Math.round(value)] ??
    value.toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "")
  );
}

// Helper to generate all step values
function getStepValues(min: number, max: number, step: number): number[] {
  const values = [];
  for (let v = min; v <= max; v += step) {
    // Avoid floating point issues
    values.push(Number(v.toFixed(6)));
  }
  // Ensure max is included
  if (values[values.length - 1] !== max) values.push(max);
  return values;
}

// Helper to get label position
function getLabelPosition(
  angle: number,
  radius: number,
  center: number
): { left: number; top: number } {
  const rad = (angle - 90) * (Math.PI / 180); // -90 to start at top
  const x = center + radius * Math.cos(rad);
  const y = center + radius * Math.sin(rad);
  return { left: x, top: y };
}

function ArrowKnob({
  value,
  min,
  max,
  step = 1,
  label,
  unit = "",
  onChange,
  valueLabels,
}: ArrowKnobProps): React.ReactElement {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const [isRightSide, setIsRightSide] = useState(false);
  const hasLabel = label !== "";

  const rotation = getRotation(value, min, max);
  const displayValue = getDisplayValue(value, step, unit, valueLabels);
  const ariaValueText =
    typeof displayValue === "string"
      ? displayValue
      : value.toFixed(step >= 1 ? 0 : 2) + (unit ? ` ${unit}` : "");

  const knobSize = 80; // px, adjust as needed
  const labelRadius = 38; // px, adjust for label distance from center
  const stepValues = getStepValues(min, max, step);

  function handleMouseDown(e: React.MouseEvent): void {
    const knobRect = knobRef.current?.getBoundingClientRect();
    if (!knobRect) return;

    // Calculate if the click was on the right side of the knob's center
    const knobCenterX = knobRect.left + knobRect.width / 2;
    const isRight = e.clientX > knobCenterX;

    setIsDragging(true);
    setIsRightSide(isRight);
    setStartY(e.clientY);
    setStartValue(value);
  }

  const handleMouseMove = useCallback(
    (e: MousePosition): void => {
      const sensitivity = 1.0;
      const deltaY = (startY - e.clientY) * sensitivity;
      const range = max - min;
      const adjustedDeltaY = isRightSide ? -deltaY : deltaY;
      const newValue = Math.min(
        max,
        Math.max(min, startValue + (adjustedDeltaY / 100) * range)
      );

      onChange(Number(newValue.toFixed(1)));
    },
    [min, max, startY, startValue, onChange, isRightSide]
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
    <div
      className={styles.knobContainer}
      style={{ position: "relative", width: knobSize, height: knobSize }}
    >
      {/* Value labels around the knob */}
      {stepValues.map((v) => {
        const angle = getRotation(v, min, max);
        const { left, top } = getLabelPosition(
          angle,
          labelRadius,
          knobSize / 2
        );
        const labelText = getDisplayValue(v, step, unit, valueLabels);
        return (
          <div key={v} className={styles.knobValueContainer}>
            <div
              className={styles.knobValue}
              style={{
                position: "absolute",
                left: left / 1.3,
                top: top / 1.3,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 2,
              }}
            >
              {labelText}
            </div>
          </div>
        );
      })}
      {/* Remove dynamic value display, always show label if present */}
      {hasLabel && <div className={styles.knobLabel}>{label}</div>}
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

export default ArrowKnob;
