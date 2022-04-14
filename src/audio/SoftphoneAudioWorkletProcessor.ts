import Ieee from "./codecs/Ieee";
import Mulaw from "./codecs/Mulaw";

/**
 * The AudioWorkletProcessor for the inbound audio
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/AudioWorkletProcessor
 */
class SoftPhoneAudioWorkletProcessor extends AudioWorkletProcessor {
    _queue: Array<number> = [];        // A queue containing all received samples.

    constructor(props: any) {
        super(props);
        this.port.onmessage = this.handleMessage;
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode/port#examples
     */
    handleMessage(event: MessageEvent): void {
        const samples8 = event.data.bytes;

        // Add each inbound audio sample into the playback queue.
        for (let sampleIndex = 0; sampleIndex < samples8.length; sampleIndex++) {
            const sample16 = Mulaw.decode(samples8[sampleIndex]);   // Decode uLaw sample to PCM.
            const sample32 = Ieee.decode(sample16);                 // Encode PCM sample to IEEE.
            this._queue.push(sample32);
        }
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
     */
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        let device = outputs[0];
        let channel = device[0];
        const audioBuffer = new Float32Array(channel.length);

        // Read a buffer of decoded samples from the queue.
        for (let i = 0; i < channel.length; i++) {
            audioBuffer[i] = this._queue.shift() || 0;
        }

        // Write the buffer to each channel of every output device.
        for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
            device = outputs[outputIndex];

            for (let channelIndex = 0; channelIndex < device.length; channelIndex++) {
                channel = device[channelIndex];

                for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex++) {
                    channel[sampleIndex] = audioBuffer[sampleIndex];
                }
            }
        }

        return true;
    }
}

registerProcessor('softphone-audio-worklet', SoftPhoneAudioWorkletProcessor);