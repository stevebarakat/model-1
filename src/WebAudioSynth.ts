export class NoiseGenerator {
  private context: AudioContext;
  private bufferSize: number;
  private whiteNoiseBuffer: AudioBuffer;
  private pinkNoiseBuffer: AudioBuffer;
  private gainNode: GainNode;
  private boostGainNode: GainNode;
  private filterNode: BiquadFilterNode;
  private currentSource: AudioBufferSourceNode | null;
  private isPlaying: boolean;
  private type: "white" | "pink";
  private tone: number;
  private sync: boolean;
  private syncCallback: (() => void) | null;
  private lastSyncTime: number;
  private syncInterval: number;

  constructor(context: AudioContext) {
    this.context = context;
    this.bufferSize = 4096;
    this.whiteNoiseBuffer = this.createWhiteNoiseBuffer();
    this.pinkNoiseBuffer = this.createPinkNoiseBuffer();
    this.gainNode = context.createGain();
    this.boostGainNode = context.createGain();
    this.filterNode = context.createBiquadFilter();
    this.currentSource = null;
    this.isPlaying = false;
    this.type = "white";
    this.tone = 1000;
    this.sync = false;
    this.syncCallback = null;
    this.lastSyncTime = 0;
    this.syncInterval = 0;

    // Configure filter
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = this.tone;
    this.filterNode.Q.value = 0.7;

    // Set boost gain to 16x (24dB)
    this.boostGainNode.gain.value = 16;

    // Connect nodes
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.boostGainNode);
    this.boostGainNode.connect(context.destination);
  }

  private createWhiteNoiseBuffer(): AudioBuffer {
    const buffer = this.context.createBuffer(
      1,
      this.bufferSize,
      this.context.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Use Float32Array for better performance
    const randomValues = new Float32Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      randomValues[i] = Math.random() * 2 - 1;
    }

    data.set(randomValues);
    return buffer;
  }

  private createPinkNoiseBuffer(): AudioBuffer {
    const buffer = this.context.createBuffer(
      1,
      this.bufferSize,
      this.context.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Use Float32Array for better performance
    const pinkNoise = new Float32Array(this.bufferSize);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < this.bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      pinkNoise[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 * 0.5362;
      pinkNoise[i] *= 0.11;
      b6 = white * 0.115926;
    }

    data.set(pinkNoise);
    return buffer;
  }

  private startNoise(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
    }

    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer =
      this.type === "white" ? this.whiteNoiseBuffer : this.pinkNoiseBuffer;
    this.currentSource.loop = true;
    this.currentSource.connect(this.filterNode);
    this.currentSource.start();
    this.isPlaying = true;

    if (this.sync) {
      this.startSync();
    }
  }

  private startSync(): void {
    if (!this.syncCallback) {
      this.syncCallback = () => {
        const now = this.context.currentTime;
        if (now - this.lastSyncTime >= this.syncInterval) {
          this.restartNoise();
          this.lastSyncTime = now;
        }
        requestAnimationFrame(this.syncCallback!);
      };
    }
    this.lastSyncTime = this.context.currentTime;
    requestAnimationFrame(this.syncCallback);
  }

  private stopSync(): void {
    if (this.syncCallback) {
      cancelAnimationFrame(this.syncCallback as unknown as number);
      this.syncCallback = null;
    }
  }

  private restartNoise(): void {
    if (this.isPlaying) {
      const currentTime = this.context.currentTime;
      this.currentSource?.stop(currentTime);
      this.currentSource?.disconnect();
      this.startNoise();
    }
  }

  setVolume(value: number): void {
    // Convert linear 0-1 to logarithmic scale
    const logValue = Math.pow(value, 2);
    this.gainNode.gain.setTargetAtTime(
      logValue,
      this.context.currentTime,
      0.01
    );
  }

  setType(type: "white" | "pink"): void {
    if (this.type !== type) {
      this.type = type;
      if (this.isPlaying) {
        this.restartNoise();
      }
    }
  }

  setTone(value: number): void {
    this.tone = value;
    this.filterNode.frequency.setTargetAtTime(
      value,
      this.context.currentTime,
      0.01
    );
  }

  setSync(sync: boolean, interval: number = 1): void {
    if (this.sync !== sync) {
      this.sync = sync;
      this.syncInterval = interval;

      if (sync) {
        this.startSync();
      } else {
        this.stopSync();
      }
    }
  }

  start(): void {
    if (!this.isPlaying) {
      this.startNoise();
    }
  }

  stop(): void {
    if (this.isPlaying) {
      this.currentSource?.stop();
      this.currentSource?.disconnect();
      this.currentSource = null;
      this.isPlaying = false;
      this.stopSync();
    }
  }

  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
    this.filterNode.disconnect();
    this.whiteNoiseBuffer = null as unknown as AudioBuffer;
    this.pinkNoiseBuffer = null as unknown as AudioBuffer;
  }
}
