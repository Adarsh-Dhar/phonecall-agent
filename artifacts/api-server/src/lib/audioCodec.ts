/**
 * Audio codec helpers — μ-law (G.711) ↔ PCM16 + naive linear resampler
 *
 * Twilio Media Streams send and expect:  μ-law encoded, 8 kHz, mono
 * Gemini Live API sends and expects:     PCM16 (little-endian), 24 kHz, mono
 *
 * Pipeline (inbound, Twilio → Gemini):
 *   base64 → Buffer → decodeMulaw() → resamplePcm16(8000→24000) → PCM16 buffer
 *
 * Pipeline (outbound, Gemini → Twilio):
 *   PCM16 buffer → resamplePcm16(24000→8000) → encodeMulaw() → base64
 *
 * Note on resampling quality: resamplePcm16 uses simple linear interpolation.
 * This is adequate for speech intelligibility. If audio quality complaints
 * arise, swap for a proper polyphase resampler.
 */

// ---------------------------------------------------------------------------
// G.711 μ-law lookup tables
// ---------------------------------------------------------------------------

// Precomputed μ-law decode table: maps a 8-bit μ-law byte to a 16-bit linear PCM sample.
const MULAW_DECODE_TABLE: Int16Array = (() => {
  const table = new Int16Array(256);
  for (let i = 0; i < 256; i++) {
    // Invert all bits (Twilio uses inverted μ-law)
    let ulaw = ~i & 0xff;
    const sign = ulaw & 0x80;
    const exponent = (ulaw >> 4) & 0x07;
    const mantissa = ulaw & 0x0f;
    let sample = ((mantissa << 1) + 33) << exponent;
    sample -= 33;
    table[i] = sign !== 0 ? -sample : sample;
  }
  return table;
})();

/**
 * Decode a single μ-law byte to a 16-bit linear PCM sample.
 */
export function mulawToLinear(ulawByte: number): number {
  return MULAW_DECODE_TABLE[ulawByte & 0xff] ?? 0;
}

/**
 * Encode a 16-bit linear PCM sample to a μ-law byte.
 */
export function linearToMulaw(sample: number): number {
  // Clamp to int16 range
  let s = Math.max(-32768, Math.min(32767, sample));

  const sign = s < 0 ? 0x80 : 0;
  if (s < 0) s = -s;

  // Add bias
  s += 33;
  if (s > 32767) s = 32767;

  // Find segment
  let exponent = 7;
  for (let exp = 7; exp >= 0; exp--) {
    if (s >= (1 << (exp + 5))) {
      exponent = exp;
      break;
    }
    if (exp === 0) exponent = 0;
  }

  const mantissa = (s >> (exponent + 1)) & 0x0f;
  const ulawByte = ~(sign | (exponent << 4) | mantissa) & 0xff;
  return ulawByte;
}

// ---------------------------------------------------------------------------
// Buffer-level codec functions
// ---------------------------------------------------------------------------

/**
 * Decode an entire μ-law buffer (one byte per sample) to PCM16 samples.
 * Each input byte becomes one Int16 sample.
 */
export function decodeMulaw(buf: Buffer): Int16Array {
  const out = new Int16Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = mulawToLinear(buf[i] ?? 0);
  }
  return out;
}

/**
 * Encode PCM16 samples to a μ-law buffer (one byte per sample).
 */
export function encodeMulaw(samples: Int16Array): Buffer {
  const out = Buffer.allocUnsafe(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = linearToMulaw(samples[i] ?? 0);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Resampler
// ---------------------------------------------------------------------------

/**
 * Resample a PCM16 Int16Array from `fromRate` to `toRate` using linear
 * interpolation. Works for both upsampling (8→24 kHz) and downsampling
 * (24→8 kHz).
 *
 * @param samples   Input PCM16 samples
 * @param fromRate  Source sample rate in Hz (e.g. 8000)
 * @param toRate    Target sample rate in Hz (e.g. 24000)
 * @returns         Resampled PCM16 samples
 */
export function resamplePcm16(
  samples: Int16Array,
  fromRate: number,
  toRate: number
): Int16Array {
  if (fromRate === toRate) return samples;

  const ratio = fromRate / toRate;
  const outLength = Math.round((samples.length * toRate) / fromRate);
  const out = new Int16Array(outLength);

  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const srcIdx = Math.floor(srcPos);
    const frac = srcPos - srcIdx;

    const s0 = samples[srcIdx] ?? 0;
    const s1 = samples[srcIdx + 1] ?? s0; // clamp at end

    // Linear interpolation, clamped to int16 range
    const interpolated = s0 + frac * (s1 - s0);
    out[i] = Math.max(-32768, Math.min(32767, Math.round(interpolated)));
  }

  return out;
}

// ---------------------------------------------------------------------------
// Convenience: full decode pipeline (base64 μ-law → PCM16 at target rate)
// ---------------------------------------------------------------------------

/**
 * Decode a base64 μ-law payload (as received from Twilio Media Stream) into
 * PCM16 samples at the desired output rate.
 *
 * @param base64Payload  Raw base64 string from Twilio's `media.payload` field
 * @param inputRate      Twilio stream rate, typically 8000
 * @param outputRate     Desired PCM16 output rate, e.g. 24000 for Gemini Live
 */
export function twilioPayloadToPcm16(
  base64Payload: string,
  inputRate = 8000,
  outputRate = 24000
): Int16Array {
  const buf = Buffer.from(base64Payload, "base64");
  const pcm8k = decodeMulaw(buf);
  return resamplePcm16(pcm8k, inputRate, outputRate);
}

/**
 * Encode PCM16 samples (at Gemini's output rate) into a base64 μ-law payload
 * ready to be sent back to Twilio as a `media` event.
 *
 * @param samples     PCM16 samples from Gemini Live
 * @param inputRate   Rate of the incoming PCM, e.g. 24000 for Gemini Live
 * @param outputRate  Twilio stream rate, typically 8000
 */
export function pcm16ToTwilioPayload(
  samples: Int16Array,
  inputRate = 24000,
  outputRate = 8000
): string {
  const resampled = resamplePcm16(samples, inputRate, outputRate);
  const mulaw = encodeMulaw(resampled);
  return mulaw.toString("base64");
}

// ---------------------------------------------------------------------------
// Exotel Voicebot Applet — raw PCM16 (no μ-law), 8 kHz mono, base64
// ---------------------------------------------------------------------------

/**
 * Decode a base64 raw-PCM16 payload (as received from Exotel's Voicebot
 * Applet `media` event) into PCM16 samples at the desired output rate.
 */
export function exotelPayloadToPcm16(
  base64Payload: string,
  inputRate = 8000,
  outputRate = 24000
): Int16Array {
  const buf = Buffer.from(base64Payload, "base64");
  const pcm8k = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
  return resamplePcm16(pcm8k, inputRate, outputRate);
}

/**
 * Encode PCM16 samples (at Gemini's output rate) into a base64 raw-PCM16
 * payload ready to send back to Exotel as a `media` event.
 */
export function pcm16ToExotelPayload(
  samples: Int16Array,
  inputRate = 24000,
  outputRate = 8000
): string {
  const resampled = resamplePcm16(samples, inputRate, outputRate);
  return Buffer.from(resampled.buffer, resampled.byteOffset, resampled.byteLength).toString("base64");
}
