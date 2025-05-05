import {
  OscillatorSettings,
  FilterType,
  NoiseType,
  WaveformType,
  LFORouting,
} from "../../synth/types";
import Mixer from "../Mixer/Mixer";
import OscillatorBank from "../OscillatorBank/OscillatorBank";
import Modifiers from "../Modifiers/Modifiers";
import Effects from "../Effects/Effects";
import styles from "./SynthControls.module.css";

type SynthControlsProps = {
  oscillators: {
    osc1: OscillatorSettings;
    osc2: OscillatorSettings;
    osc3: OscillatorSettings;
  };
  mixer: {
    osc1Volume: number;
    osc2Volume: number;
    osc3Volume: number;
    noiseVolume: number;
    noiseType: NoiseType;
    modMix: number;
  };
  modifiers: {
    cutoff: number;
    resonance: number;
    contourAmount: number;
    filterType: FilterType;
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
    lfo: {
      rate: number;
      depth: number;
      waveform: WaveformType;
      routing: LFORouting;
    };
  };
  effects: {
    reverb: { amount: number };
    delay: { amount: number };
    distortion: { outputGain: number };
  };
  onOscillatorChange: (osc: 1 | 2 | 3, settings: OscillatorSettings) => void;
  onMixerChange: (settings: Partial<SynthControlsProps["mixer"]>) => void;
  onModifiersChange: (
    settings: Partial<SynthControlsProps["modifiers"]>
  ) => void;
  onEffectsChange: (settings: Partial<SynthControlsProps["effects"]>) => void;
};

function SynthControls({
  oscillators,
  mixer,
  modifiers,
  effects,
  onOscillatorChange,
  onMixerChange,
  onModifiersChange,
  onEffectsChange,
}: SynthControlsProps) {
  const handleOsc1Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    onOscillatorChange(1, {
      ...oscillators.osc1,
      [param]: value,
    });
  };

  const handleOsc2Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    onOscillatorChange(2, {
      ...oscillators.osc2,
      [param]: value,
    });
  };

  const handleOsc3Change = (
    param: keyof OscillatorSettings,
    value: OscillatorSettings[keyof OscillatorSettings]
  ) => {
    onOscillatorChange(3, {
      ...oscillators.osc3,
      [param]: value,
    });
  };

  return (
    <>
      <Mixer
        osc1Volume={mixer.osc1Volume}
        osc2Volume={mixer.osc2Volume}
        osc3Volume={mixer.osc3Volume}
        osc1Pan={oscillators.osc1.pan ?? 0}
        osc2Pan={oscillators.osc2.pan ?? 0}
        osc3Pan={oscillators.osc3.pan ?? 0}
        noiseVolume={mixer.noiseVolume}
        noiseType={mixer.noiseType}
        modMix={mixer.modMix}
        onModMixChange={(value) => onMixerChange({ modMix: value })}
        onOsc1VolumeChange={(value) => onMixerChange({ osc1Volume: value })}
        onOsc2VolumeChange={(value) => onMixerChange({ osc2Volume: value })}
        onOsc3VolumeChange={(value) => onMixerChange({ osc3Volume: value })}
        onOsc1PanChange={(value) => handleOsc1Change("pan", value)}
        onOsc2PanChange={(value) => handleOsc2Change("pan", value)}
        onOsc3PanChange={(value) => handleOsc3Change("pan", value)}
        onNoiseVolumeChange={(value) => onMixerChange({ noiseVolume: value })}
        onNoiseTypeChange={(value) => onMixerChange({ noiseType: value })}
      />
      <div className={styles.indent}></div>
      <OscillatorBank
        osc1={oscillators.osc1}
        osc2={oscillators.osc2}
        osc3={oscillators.osc3}
        onOsc1Change={handleOsc1Change}
        onOsc2Change={handleOsc2Change}
        onOsc3Change={handleOsc3Change}
      />
      <div className={styles.indent}></div>
      <Modifiers
        cutoff={modifiers.cutoff}
        resonance={modifiers.resonance}
        contourAmount={modifiers.contourAmount}
        filterType={modifiers.filterType}
        attackTime={modifiers.envelope.attack}
        decayTime={modifiers.envelope.decay}
        sustainLevel={modifiers.envelope.sustain}
        releaseTime={modifiers.envelope.release}
        lfoRate={modifiers.lfo.rate}
        lfoDepth={modifiers.lfo.depth}
        lfoWaveform={modifiers.lfo.waveform}
        lfoRouting={modifiers.lfo.routing}
        onCutoffChange={(value) => onModifiersChange({ cutoff: value })}
        onResonanceChange={(value) => onModifiersChange({ resonance: value })}
        onContourAmountChange={(value) =>
          onModifiersChange({ contourAmount: value })
        }
        onFilterTypeChange={(type: BiquadFilterType) =>
          onModifiersChange({ filterType: type as FilterType })
        }
        onAttackTimeChange={(value) =>
          onModifiersChange({
            envelope: { ...modifiers.envelope, attack: value },
          })
        }
        onDecayTimeChange={(value) =>
          onModifiersChange({
            envelope: { ...modifiers.envelope, decay: value },
          })
        }
        onSustainLevelChange={(value) =>
          onModifiersChange({
            envelope: { ...modifiers.envelope, sustain: value },
          })
        }
        onReleaseTimeChange={(value) =>
          onModifiersChange({
            envelope: { ...modifiers.envelope, release: value },
          })
        }
        onLfoRateChange={(value) =>
          onModifiersChange({ lfo: { ...modifiers.lfo, rate: value } })
        }
        onLfoDepthChange={(value) =>
          onModifiersChange({ lfo: { ...modifiers.lfo, depth: value } })
        }
        onLfoWaveformChange={(value) =>
          onModifiersChange({ lfo: { ...modifiers.lfo, waveform: value } })
        }
        onLfoRoutingChange={(value) =>
          onModifiersChange({ lfo: { ...modifiers.lfo, routing: value } })
        }
      />
      <div className={styles.indent}></div>
      <Effects
        reverbAmount={effects.reverb.amount}
        delayAmount={effects.delay.amount}
        distortionAmount={effects.distortion.outputGain}
        onReverbAmountChange={(value) =>
          onEffectsChange({ reverb: { amount: value } })
        }
        onDelayAmountChange={(value) =>
          onEffectsChange({ delay: { amount: value } })
        }
        onDistortionAmountChange={(value) =>
          onEffectsChange({ distortion: { outputGain: value } })
        }
      />
    </>
  );
}

export default SynthControls;
