import React, { useEffect, useRef } from "react";
import styles from "./ADSRVisualizer.module.css";

interface ADSRVisualizerProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  width?: number;
  height?: number;
}

const ADSRVisualizer: React.FC<ADSRVisualizerProps> = ({
  attack,
  decay,
  sustain,
  release,
  width = 200,
  height = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Add padding to prevent circles from being cut off
    const padding = 5;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set line style
    ctx.strokeStyle = "var(--primary-color)";
    ctx.lineWidth = 2;

    // Calculate points
    const totalTime = attack + decay + release;
    const sustainTime = 1; // Fixed sustain time for visualization
    const totalWidth = drawWidth;
    const totalHeight = drawHeight;

    // Scale factors
    const timeScale = totalWidth / (totalTime + sustainTime);

    // Draw grid
    ctx.strokeStyle = "#324974";
    ctx.lineWidth = 1;

    // Draw ADSR envelope
    ctx.strokeStyle = "var(--primary-color)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Start point (with padding)
    ctx.moveTo(padding, padding + totalHeight);

    // Attack (straight line)
    const attackX = padding + attack * timeScale;
    ctx.lineTo(attackX, padding);

    // Decay (straight line)
    const decayX = padding + attackX + decay * timeScale;
    const sustainY = padding + totalHeight - sustain * totalHeight;
    ctx.lineTo(decayX, sustainY);

    // Sustain (straight line)
    const sustainX = padding + decayX + sustainTime * timeScale;
    ctx.lineTo(sustainX, sustainY);

    // Release (quadratic curve with inward bend)
    const releaseX = padding + sustainX + release * timeScale;
    const releaseControlX = sustainX + release * timeScale * 0.5;
    // Calculate control point Y to be closer to the bottom for a more pronounced curve
    const releaseControlY = sustainY + (padding + totalHeight - sustainY) * 0.8;
    ctx.quadraticCurveTo(
      releaseControlX,
      releaseControlY,
      releaseX,
      padding + totalHeight
    );

    ctx.stroke();

    // Draw corner points
    const drawPoint = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#324974";
      ctx.fill();
    };

    // Draw points at each corner
    drawPoint(padding, padding + totalHeight); // Start
    drawPoint(attackX, padding); // Peak
    drawPoint(decayX, sustainY); // Sustain start
    drawPoint(sustainX, sustainY); // Sustain end
    drawPoint(releaseX, padding + totalHeight); // End
  }, [attack, decay, sustain, release, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.visualizer}
      width={width}
      height={height}
      style={{ backgroundColor: "#0F1623", borderRadius: 0 }}
    />
  );
};

export default ADSRVisualizer;
