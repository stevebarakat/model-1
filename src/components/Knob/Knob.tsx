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
  logarithmic?: boolean;
};

type MousePosition = {
  clientY: number;
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
  logarithmic = false,
}: KnobProps): React.ReactElement {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const hasLabel = label !== "";

  const rotation = getRotation(value, min, max, logarithmic);
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
      let newValue;

      if (logarithmic) {
        const logMin = Math.log(min);
        const logMax = Math.log(max);
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
          max,
          Math.max(min, startValue + (deltaY / 100) * range)
        );
      }

      onChange(Number(newValue.toFixed(1)));
    },
    [min, max, startY, startValue, onChange, logarithmic]
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
      <div className={styles.knob}>
        {/* <div className={styles.topShadow}></div> */}
        <div
          ref={knobRef}
          className={styles.outerKnob}
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
          <div className={styles.dot}></div>
          <div className={styles.innerKnobShadow}></div>
          <div className={styles.innerKnob}></div>
          <svg
            id="knob"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 383.39 409.56"
          >
            <defs>
              <linearGradient id="top-gradient" gradientTransform="rotate(90)">
                <stop className={styles.stop1} offset="0%" />
                <stop className={styles.stop2} offset="5%" />
                <stop className={styles.stop3} offset="100%" />
              </linearGradient>
            </defs>

            <path
              className={styles.knobBg}
              fill="url(#top-gradient)"
              d="M324.18,345.14c12.47-1.93,23.97-8.2,31.5-18.33,4.46-6.01,8.64-12.32,12.5-18.93,4.43-7.6,8.3-15.37,11.63-23.27,4.83-11.44,4.64-24.28.28-35.91-10.66-28.38-11.29-60.3-.37-89.94,4.24-11.51,4.25-24.25-.62-35.5-6.29-14.51-14.28-28.35-23.88-41.18-7.37-9.85-18.44-16.1-30.55-18.27-14.48-2.58-28.76-7.7-42.21-15.54-13.45-7.84-24.94-17.74-34.33-29.07-7.85-9.47-18.75-16.02-30.95-17.57-15.89-2.02-31.87-2.15-47.6-.47-12.2,1.31-23.27,7.6-31.2,16.96-20.4,24.12-48.48,39.31-78.43,44.03-12.26,1.93-23.53,8.1-31.1,17.95-5.22,6.79-10.08,13.99-14.51,21.59-3.86,6.62-7.29,13.36-10.31,20.2-5.1,11.54-4.88,24.64-.42,36.44,11,29.09,11.45,61.93-.29,92.22-4.73,12.21-4.38,25.75.96,37.71,5.39,12.08,11.97,23.68,19.68,34.61,7.74,10.97,19.6,18.15,32.86,20.27,15.28,2.44,30.37,7.68,44.54,15.94,14.17,8.26,26.17,18.8,35.82,30.89,8.38,10.49,20.47,17.27,33.83,18.59,13.3,1.32,26.64,1.33,39.81.06,13.03-1.25,24.99-7.62,33.28-17.76,20.57-25.15,49.36-40.95,80.09-45.72Z"
            />
          </svg>
        </div>
        {/* <div className={styles.bottomShadow}></div> */}
      </div>
    </div>
  );
}

export default Knob;
