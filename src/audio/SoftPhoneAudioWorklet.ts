import Base64 from './codecs/Base64';
import Ieee from './codecs/Ieee';
import Mulaw from './codecs/Mulaw';
import IWebSocketMessage from './IWebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

/**
 * The AudioWorkletProcessor for the inbound audio
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/AudioWorkletProcessor
 */
class SoftPhoneAudioWorklet extends AudioWorkletProcessor {
  public static MUTED_PARAMETER = 'muted';

  _queue: number[] = []; // A queue containing all received samples.
  _sequenceNumber = 0; // Sequence number for microphone output messages.

  constructor(options?: AudioWorkletNodeOptions) {
    super(options);
    this.port.onmessage = this.handleMessage.bind(this);
    this.process = this.process.bind(this);
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/parameterDescriptors
   */
  static get parameterDescriptors() {
    return [{
      name: SoftPhoneAudioWorklet.MUTED_PARAMETER,
      defaultValue: 1,
      minValue: 0,
      maxValue: 1,
      automationRate: 'a-rate'
    }]
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode/port#examples
   */
  handleMessage(event: MessageEvent<IWebSocketMessage>): void {
    const samples8 = Base64.decode(event.data.payload);

    // Add each inbound audio sample into the playback queue.
    for (let sampleIndex = 0; sampleIndex < samples8.length; sampleIndex++) {
      const sample16 = Mulaw.decode(samples8[sampleIndex]); // Decode uLaw sample as PCM.
      const sample32 = Ieee.encode(sample16); // Encode PCM sample as IEEE.
      this._queue.push(sample32); // The queue is what the hardware will read from.
    }
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
   */
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    let outputDevice = outputs[0];

    if (outputDevice) {
      let outputChannel = outputDevice[0];

      if (outputChannel) {
        const outputWaveBuffer = new Float32Array(outputChannel.length);

        // Read a buffer of decoded samples from the queue.
        for (let i = 0; i < outputChannel.length; i++) {
          outputWaveBuffer[i] = this._queue.shift() || 0;
        }

        // Write the buffer to each channel of every output device.
        for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
          outputDevice = outputs[outputIndex];

          for (let channelIndex = 0; channelIndex < outputDevice.length; channelIndex++) {
            outputChannel = outputDevice[channelIndex];

            for (let sampleIndex = 0; sampleIndex < outputChannel.length; sampleIndex++) {
              outputChannel[sampleIndex] = outputWaveBuffer[sampleIndex];
            }
          }
        }
      }
    }

    // Read the first channel of the first input device into an outbound audio message.
    const inputDevice = inputs[0];
    const muteParameter = parameters[SoftPhoneAudioWorklet.MUTED_PARAMETER];

    if (inputDevice) {
      const inputChannel = inputs[0][0];

      if (inputChannel) {
        const inputWaveBuffer = new Uint8Array(inputChannel.length);

        for (let sampleIndex = 0; sampleIndex < inputChannel.length; sampleIndex++) {
          const muted = muteParameter.length === 1 ? muteParameter[0] : muteParameter[sampleIndex];
          const sample16 = muted === 1 ? 0 : Ieee.decode(inputChannel[sampleIndex]);    // Decode IEEE sample as PCM.
          inputWaveBuffer[sampleIndex] = Mulaw.encode(sample16);                        // Encode PCM sample as uLaw.
        }

        const message: IWebSocketMessage = {
          sequenceNumber: this._sequenceNumber++,
          type: WebSocketMessageType.OutboundAudio,
          payload: Base64.encode(inputWaveBuffer)
        };

        this.port.postMessage(message);
      }
    }

    return true;
  }
}

registerProcessor('softphone-audio-worklet', SoftPhoneAudioWorklet);
