declare module "tunajs" {
  export default class Tuna {
    constructor(context: AudioContext);

    Overdrive: new (options: {
      outputGain: number;
      drive: number;
      curveAmount: number;
      algorithmIndex: number;
      bypass: number;
    }) => AudioNode & {
      drive: number;
      outputGain: number;
      curveAmount: number;
      algorithmIndex: number;
      bypass: number;
    };
  }
}
