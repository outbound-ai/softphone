import "atob";
import "../@types/btoa";

export default class Base64 {

    /**
     * Encodes an array of unsigned 8-bit integers into a base64 string.
     * @param bytes An array of unsigned 8-bit integers.
     * @returns A base64 encoded string.
     */
    encode(bytes: Uint8Array): string {
        let binaryString = "";

        for (let i = 0; i < bytes.length; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }

        return btoa(binaryString);
    }

    /**
     * Decodes a base64 string into an array of unsigned 8-bit integers.
     * @param string A base64 encoded string.
     * @returns An array of unsigned 8-bit integers.
     */
    decode(string: string): Uint8Array {
        const binaryString = atob(string);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes;
    }
}