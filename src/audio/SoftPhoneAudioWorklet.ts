import Base64 from './codecs/Base64';
import Ieee from './codecs/Ieee';
import Mulaw from './codecs/Mulaw';
import WebSocketMessage, { IWebSocketMessage } from './WebSocketMessage';
import WebSocketMessageType from './WebSocketMessageType';

/**
 * The AudioWorkletProcessor for the inbound audio
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/AudioWorkletProcessor
 */
class SoftPhoneAudioWorklet extends AudioWorkletProcessor {
  _queue: number[] = []; // A queue containing all received samples.
  _sequenceNumber = 0; // Sequence number for microphone output messages.

  // @ts-ignore
  constructor(...options) {
    super(...options);
    this.port.onmessage = this.handleMessage.bind(this);
    this.process = this.process.bind(this);
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

    if (inputDevice) {
      const inputChannel = inputs[0][0];

      if (inputChannel) {
        const inputWaveBuffer = new Uint8Array(inputChannel.length);

        for (let sampleIndex = 0; sampleIndex < inputChannel.length; sampleIndex++) {
          const sample16 = Ieee.decode(inputChannel[sampleIndex]); // Decode IEEE sample as PCM.
          inputWaveBuffer[sampleIndex] = Mulaw.encode(sample16); // Encode PCM sample as uLaw.
        }

        this.port.postMessage(
          new WebSocketMessage(
            this._sequenceNumber++,
            WebSocketMessageType.OutboundAudio,
            Base64.encode(inputWaveBuffer)
          )
        );
      }
    }

    return true;
  }
}

registerProcessor('softphone-audio-worklet', SoftPhoneAudioWorklet);
