import {
  OscillatorSettings,
  FilterType,
  WaveformType,
  LFORouting,
} from "@/synth/types/index";
import Modifiers from "../Modifiers";
import Effects from "../Effects";
import Noise from "../Noise/Noise";
import Spacer from "../Spacer";
import Mixer from "../Mixer";
import OscillatorBank from "../OscillatorBank";

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
    modMix: number;
    osc1Bypassed: boolean;
    osc2Bypassed: boolean;
    osc3Bypassed: boolean;
  };
  noise: {
    volume: number;
    pan: number;
    type: "white" | "pink";
    tone: number;
    sync: boolean;
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
    reverb: { amount: number; decay: number; eq: number };
    delay: { amount: number; time: number; feedback: number };
    distortion: { outputGain: number; lowEQ: number; highEQ: number };
  };
  onOscillatorChange: (osc: 1 | 2 | 3, settings: OscillatorSettings) => void;
  onMixerChange: (settings: Partial<SynthControlsProps["mixer"]>) => void;
  onNoiseChange: (settings: Partial<SynthControlsProps["noise"]>) => void;
  onModifiersChange: (
    settings: Partial<SynthControlsProps["modifiers"]>
  ) => void;
  onEffectsChange: (settings: Partial<SynthControlsProps["effects"]>) => void;
};

function SynthControls({
  oscillators,
  mixer,
  noise,
  modifiers,
  effects,
  onOscillatorChange,
  onMixerChange,
  onNoiseChange,
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
      {/* <OscillatorSection
        osc1Volume={mixer.osc1Volume}
        osc2Volume={mixer.osc2Volume}
        osc3Volume={mixer.osc3Volume}
        osc1Pan={oscillators.osc1.pan ?? 0}
        osc2Pan={oscillators.osc2.pan ?? 0}
        osc3Pan={oscillators.osc3.pan ?? 0}
        onOsc1VolumeChange={(value) => onMixerChange({ osc1Volume: value })}
        onOsc2VolumeChange={(value) => onMixerChange({ osc2Volume: value })}
        onOsc3VolumeChange={(value) => onMixerChange({ osc3Volume: value })}
        onOsc1PanChange={(value) => handleOsc1Change("pan", value)}
        onOsc2PanChange={(value) => handleOsc2Change("pan", value)}
        onOsc3PanChange={(value) => handleOsc3Change("pan", value)}
        osc1={oscillators.osc1}
        osc2={oscillators.osc2}
        osc3={oscillators.osc3}
        onOsc1Change={handleOsc1Change}
        onOsc2Change={handleOsc2Change}
        onOsc3Change={handleOsc3Change}
      /> */}
      <Mixer
        osc1Volume={mixer.osc1Volume}
        osc2Volume={mixer.osc2Volume}
        osc3Volume={mixer.osc3Volume}
        osc1Pan={oscillators.osc1.pan ?? 0}
        osc2Pan={oscillators.osc2.pan ?? 0}
        osc3Pan={oscillators.osc3.pan ?? 0}
        osc1Bypassed={mixer.osc1Bypassed}
        osc2Bypassed={mixer.osc2Bypassed}
        osc3Bypassed={mixer.osc3Bypassed}
        onOsc1VolumeChange={(value) => onMixerChange({ osc1Volume: value })}
        onOsc2VolumeChange={(value) => onMixerChange({ osc2Volume: value })}
        onOsc3VolumeChange={(value) => onMixerChange({ osc3Volume: value })}
        onOsc1PanChange={(value) => handleOsc1Change("pan", value)}
        onOsc2PanChange={(value) => handleOsc2Change("pan", value)}
        onOsc3PanChange={(value) => handleOsc3Change("pan", value)}
        onOsc1BypassChange={(bypassed) =>
          onMixerChange({ osc1Bypassed: bypassed })
        }
        onOsc2BypassChange={(bypassed) =>
          onMixerChange({ osc2Bypassed: bypassed })
        }
        onOsc3BypassChange={(bypassed) =>
          onMixerChange({ osc3Bypassed: bypassed })
        }
      />
      <OscillatorBank
        osc1={oscillators.osc1}
        osc2={oscillators.osc2}
        osc3={oscillators.osc3}
        onOsc1Change={handleOsc1Change}
        onOsc2Change={handleOsc2Change}
        onOsc3Change={handleOsc3Change}
      />
      <Noise
        volume={noise.volume}
        pan={noise.pan}
        type={noise.type}
        tone={noise.tone}
        sync={noise.sync}
        onVolumeChange={(value: number) => onNoiseChange({ volume: value })}
        onPanChange={(value: number) => onNoiseChange({ pan: value })}
        onTypeChange={(value: "white" | "pink") =>
          onNoiseChange({ type: value })
        }
        onToneChange={(value: number) => onNoiseChange({ tone: value })}
        onSyncChange={(value: boolean) => onNoiseChange({ sync: value })}
      />
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
      <Effects
        reverbAmount={effects.reverb.amount}
        reverbDecay={effects.reverb.decay}
        reverbEq={effects.reverb.eq}
        delayAmount={effects.delay.amount}
        delayTime={effects.delay.time}
        delayFeedback={effects.delay.feedback}
        distortionAmount={effects.distortion.outputGain}
        distortionLowEQ={effects.distortion.lowEQ}
        distortionHighEQ={effects.distortion.highEQ}
        onReverbAmountChange={(value) =>
          onEffectsChange({ reverb: { ...effects.reverb, amount: value } })
        }
        onReverbDecayChange={(value) =>
          onEffectsChange({ reverb: { ...effects.reverb, decay: value } })
        }
        onReverbEqChange={(value) =>
          onEffectsChange({ reverb: { ...effects.reverb, eq: value } })
        }
        onDelayAmountChange={(value) =>
          onEffectsChange({ delay: { ...effects.delay, amount: value } })
        }
        onDelayTimeChange={(value) =>
          onEffectsChange({ delay: { ...effects.delay, time: value } })
        }
        onDelayFeedbackChange={(value) =>
          onEffectsChange({ delay: { ...effects.delay, feedback: value } })
        }
        onDistortionAmountChange={(value) =>
          onEffectsChange({
            distortion: { ...effects.distortion, outputGain: value },
          })
        }
        onDistortionLowEQChange={(value) =>
          onEffectsChange({
            distortion: { ...effects.distortion, lowEQ: value },
          })
        }
        onDistortionHighEQChange={(value) =>
          onEffectsChange({
            distortion: { ...effects.distortion, highEQ: value },
          })
        }
      />
      <Spacer />
    </>
  );
}

export default SynthControls;
