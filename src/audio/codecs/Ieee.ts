const buffer = new Int16Array(1)

/**
 * An IEEE audio CODEC.
 */
export default class Ieee {
  /**
   * Convert a 32-bit IEEE audio sample into a 16-bit PCM audio sample.
   * @param sample32 A 32-bit IEEE floating point audio sample.
   * @returns A 16-bit signed integer PCM audio sample.
   */
  static decode(sample32: number) {
    if (sample32 > 0) {
      buffer[0] = sample32 * 32767.0
    } else {
      buffer[0] = sample32 * 32768.0
    }

    return buffer[0]
  }

  /**
   * Convert a 16-bit PCM audio sample into a 32-bit IEEE audio sample.
   * @param sample16 A 16-bit signed integer PCM audio sample.
   * @returns A 32-bit IEEE floating point audio sample.
   */
  static encode(sample16: number): number {
    if (sample16 > 0) {
      return sample16 / 32767.0
    } else {
      return sample16 / 32768.0
    }
  }
}
