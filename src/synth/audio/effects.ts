import Tuna from "tunajs";

export function setupEffects(context: AudioContext) {
  const masterGain = context.createGain();
  masterGain.gain.value = 0.3;

  const delayNode = context.createDelay(1.0);
  delayNode.delayTime.value = 0.3;
  const delayGain = context.createGain();
  delayGain.gain.value = 0;
  const delayFeedback = context.createGain();
  delayFeedback.gain.value = 0.6;

  const reverbNode = context.createConvolver();
  const reverbGain = context.createGain();
  reverbGain.gain.value = 0;

  // Add EQ filter for reverb
  const reverbEQ = context.createBiquadFilter();
  reverbEQ.type = "lowshelf";
  reverbEQ.frequency.value = 1000;
  reverbEQ.gain.value = 0;

  // Create impulse response with configurable decay
  function createImpulseResponse(decay: number) {
    const sampleRate = context.sampleRate;
    const length = sampleRate * decay;
    const impulse = context.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decayFactor = Math.exp((-3 * i) / length);
      leftChannel[i] = (Math.random() * 2 - 1) * decayFactor;
      rightChannel[i] = (Math.random() * 2 - 1) * decayFactor;
    }

    return impulse;
  }

  // Set initial impulse response
  reverbNode.buffer = createImpulseResponse(1.5);

  const tuna = new Tuna(context);
  const distortion = new tuna.Overdrive({
    outputGain: 0.5,
    drive: 0.7,
    curveAmount: 1,
    algorithmIndex: 0,
    bypass: 0,
  });

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  const dryGain = context.createGain();
  const wetGain = context.createGain();
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  masterGain.connect(dryGain);
  masterGain.connect(distortion);
  distortion.connect(compressor);
  compressor.connect(wetGain);

  masterGain.connect(delayNode);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(delayGain);

  dryGain.connect(reverbNode);
  wetGain.connect(reverbNode);
  delayGain.connect(reverbNode);

  // Connect reverb through EQ
  reverbNode.connect(reverbEQ);
  reverbEQ.connect(reverbGain);
  reverbGain.connect(context.destination);

  dryGain.connect(context.destination);
  wetGain.connect(context.destination);
  delayGain.connect(context.destination);

  return {
    masterGain,
    delayGain,
    delayNode,
    delayFeedback,
    reverbGain,
    dryGain,
    wetGain,
    reverbNode,
    reverbEQ,
    createImpulseResponse,
  };
}
