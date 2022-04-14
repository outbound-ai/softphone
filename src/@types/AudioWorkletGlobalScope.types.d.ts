/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/sampleRate
 */
declare const sampleRate: number;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/currentTime
 */
declare const currentTime: number;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletGlobalScope/registerProcessor
 */
declare function registerProcessor(
  name: string,
  processorCtor: (new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor) & { parameterDescriptors?: any[]; }
): unknown;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 */
interface AudioWorkletProcessor {

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/port
   */
  readonly port: MessagePort;

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
   */
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}


/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor
 */
declare const AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new(options?: AudioWorkletNodeOptions, ...rest: unknown[]): AudioWorkletProcessor;
  readonly parameterDescriptors: any[];
};