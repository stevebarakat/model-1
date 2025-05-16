import Knob from "../Knob/Knob";

type MixerProps = {
  osc1Volume: number;
  osc2Volume: number;
  osc3Volume: number;
  osc1Pan: number;
  osc2Pan: number;
  osc3Pan: number;
  onOsc1VolumeChange: (value: number) => void;
  onOsc2VolumeChange: (value: number) => void;
  onOsc3VolumeChange: (value: number) => void;
  onOsc1PanChange: (value: number) => void;
  onOsc2PanChange: (value: number) => void;
  onOsc3PanChange: (value: number) => void;
};

type OscillatorControlsProps = {
  volume: number;
  pan: number;
  label: string;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  showLabels?: boolean;
};

function OscillatorControls({
  volume,
  pan,
  label,
  onVolumeChange,
  onPanChange,
  showLabels = true,
}: OscillatorControlsProps) {
  return (
    <div className="row">
      <Knob
        value={volume}
        min={0}
        max={1}
        step={0.01}
        label={showLabels ? label : ""}
        onChange={onVolumeChange}
      />
      <Knob
        value={pan}
        min={-1}
        max={1}
        step={0.01}
        label={showLabels ? "Pan" : ""}
        onChange={onPanChange}
      />
    </div>
  );
}

function Mixer({
  osc1Volume,
  osc2Volume,
  osc3Volume,
  osc1Pan,
  osc2Pan,
  osc3Pan,
  onOsc1VolumeChange,
  onOsc2VolumeChange,
  onOsc3VolumeChange,
  onOsc1PanChange,
  onOsc2PanChange,
  onOsc3PanChange,
}: MixerProps) {
  return (
    <div className="box filled">
      <div className="section">
        <div className="row">
          <div className="column">
            <OscillatorControls
              volume={osc1Volume}
              pan={osc1Pan}
              label="Osc 1"
              onVolumeChange={onOsc1VolumeChange}
              onPanChange={onOsc1PanChange}
              showLabels={true}
            />
            <OscillatorControls
              volume={osc2Volume}
              pan={osc2Pan}
              label="Osc 2"
              onVolumeChange={onOsc2VolumeChange}
              onPanChange={onOsc2PanChange}
              showLabels={false}
            />
            <OscillatorControls
              volume={osc3Volume}
              pan={osc3Pan}
              label="Osc 3"
              onVolumeChange={onOsc3VolumeChange}
              onPanChange={onOsc3PanChange}
              showLabels={false}
            />
          </div>
        </div>
        <span className="section-title">Mixer</span>
      </div>
    </div>
  );
}

export default Mixer;
