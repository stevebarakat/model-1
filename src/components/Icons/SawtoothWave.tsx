import React from "react";

interface SawtoothWaveProps {
  size?: number;
  strokeWidth?: number;
}

const SawtoothWave: React.FC<SawtoothWaveProps> = ({
  size = 16,
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 22V6.83L2 16v-2.83L13 2v15.17L22 8v2.83z"
        stroke="currentColor"
        fill="none"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default SawtoothWave;
