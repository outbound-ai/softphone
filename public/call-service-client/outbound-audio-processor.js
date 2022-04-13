function getSample16(sample32) {
    const buffer = new Int16Array(1);

    if (sample32 > 0) {
        buffer[0] = sample32 * 32767.0;
    }
    else {
        buffer[0] = sample32 * 32768.0;
    }

    return buffer[0];
}

function getHighOrderByte(sample16) {
    return (sample16 >> 8) & 0xff;
}

function getLowOrderByte(sample16) {
    return sample16 & 0xff;
}

class OutboundAudioProcessor extends AudioWorkletProcessor {
    constructor (...args) {
        super(...args);
        this._sequenceNumber = 0;
        this.process = this.process.bind(this);
    }

    process(inputs, _, __) {
        const samples32 = inputs[0][0] // There's one microphone but two channels WTF?

        if (!samples32) {
            return true;
        }

        const buffer = new Uint8Array(samples32.length * 2);
        const samples16 = new Int16Array(samples32.length);
            
        for (let sampleIndex = 0; sampleIndex < samples32.length; sampleIndex++) {
            const byteIndex = sampleIndex * 2;

            // Convert from 32-bit float to 16-bit signed integer.
            const sample16 = getSample16(samples32[sampleIndex]);
            samples16[sampleIndex] = sample16;

            // Write to buffer in big-endian byte order for network transmission.
            buffer[byteIndex] = getHighOrderByte(sample16);
            buffer[byteIndex + 1] = getLowOrderByte(sample16);
        }

        if (this._sequenceNumber % 1000 === 0){
            console.log(this._sequenceNumber, "out", "bytes    ", buffer.join(","));
            console.log(this._sequenceNumber, "out", "samples16", samples16.join(","));
        }

        this.port.postMessage({ buffer, sequenceNumber: this._sequenceNumber });
        this._sequenceNumber += 1;
        return true;
    }
}

registerProcessor('outbound-audio-processor', OutboundAudioProcessor);