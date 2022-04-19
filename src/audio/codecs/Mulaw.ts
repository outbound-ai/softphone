const BIAS = 0x84;
const CLIP = 32635;

const decodeTable = [0, 132, 396, 924, 1980, 4092, 8316, 16764];

const encodeTable = [
  0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7
];

/**
 * A MuLaw audio compression CODEC.
 */
export default class Mulaw {
  /**
   * Encodes a 16-bit PCM audio sample into an 8-bit uLaw audio sample.
   * @param sample16 A 16-bit signed integer PCM audio sample.
   * @returns The uLaw encoded byte.
   */
  static encode(sample16: number): number {
    let sign;
    let exponent;
    let mantissa;
    let sample8;

    sign = (sample16 >> 8) & 0x80;

    if (sign !== 0) {
      sample16 = -sample16;
    }

    sample16 = sample16 + BIAS;

    if (sample16 > CLIP) {
      sample16 = CLIP;
    }

    exponent = encodeTable[(sample16 >> 7) & 0xff];
    mantissa = (sample16 >> (exponent + 3)) & 0x0f;
    sample8 = ~(sign | (exponent << 4) | mantissa);

    return sample8;
  }

  /**
   * Decode an 8-bit uLaw audio sample into a 16-bit PCM audio sample.
   * @param sample8 The uLaw encoded byte.
   * @returns A 16-bit signed integer PCM audio sample.
   */
  static decode(sample8: number): number {
    let sign;
    let exponent;
    let mantissa;
    let sample16;

    sample8 = ~sample8;
    sign = sample8 & 0x80;
    exponent = (sample8 >> 4) & 0x07;
    mantissa = sample8 & 0x0f;
    sample16 = decodeTable[exponent] + (mantissa << (exponent + 3));

    if (sign !== 0) {
      sample16 = -sample16;
    }

    return sample16;
  }
}
