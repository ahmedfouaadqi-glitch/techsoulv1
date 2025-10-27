// This file implements audio encoding and decoding helpers as per Gemini API guidelines.
// These are essential for Text-to-Speech (TTS) and Live Conversation features.

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that can be played by the Web Audio API.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for TTS).
 * @param numChannels The number of audio channels (typically 1).
 * @returns A promise that resolves with the decoded AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Encodes a Uint8Array into a base64 string.
 * @param bytes The Uint8Array to encode.
 * @returns A base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// A global AudioContext for TTS playback
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};


/**
 * Plays audio from a base64 encoded string.
 * @param base64String The base64 encoded raw PCM audio data.
 * @returns A promise that resolves with the AudioBufferSourceNode after playback starts.
 */
export const playBase64Audio = async (base64String: string): Promise<AudioBufferSourceNode | null> => {
    if (!base64String) {
        console.warn("No audio data to play.");
        return null;
    }
    try {
        const ctx = getAudioContext();
        const decodedBytes = decode(base64String);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
        return source;
    } catch (error) {
        console.error("Failed to play audio:", error);
        return null;
    }
};
