/**
 * Basic WAV audio processing for stem separation.
 * Uses IIR filters to produce audibly different stems from a WAV source.
 * Non-WAV files are returned unmodified (copy only).
 */

// IIR low-pass filter coefficient: alpha = 2*pi*fc / (2*pi*fc + fs)
function lpfAlpha(cutoffHz, sampleRate) {
  const w = 2 * Math.PI * cutoffHz;
  return w / (w + sampleRate);
}

function isWav(bytes) {
  if (bytes.length < 44) return false;
  return (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45   // WAVE
  );
}

function parseWavHeader(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let fmt = null;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset < bytes.length - 8) {
    const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const size = view.getUint32(offset + 4, true);

    if (id === 'fmt ') {
      fmt = {
        format: view.getUint16(offset + 8, true),
        channels: view.getUint16(offset + 10, true),
        sampleRate: view.getUint32(offset + 12, true),
        bitsPerSample: view.getUint16(offset + 22, true),
      };
    } else if (id === 'data') {
      dataOffset = offset + 8;
      dataSize = size;
      break;
    }
    offset += 8 + size;
    if (size % 2 !== 0) offset++; // WAV pad byte
  }

  return { fmt, dataOffset, dataSize };
}

/**
 * Process WAV bytes to isolate a specific stem type.
 * Returns processed Uint8Array (same WAV format, modified PCM data).
 * Returns original bytes unchanged if not a valid 16-bit PCM WAV.
 */
export function processStem(sourceBytes, stemType) {
  if (!isWav(sourceBytes)) return sourceBytes;

  const { fmt, dataOffset, dataSize } = parseWavHeader(sourceBytes);
  if (!fmt || fmt.format !== 1 || fmt.bitsPerSample !== 16) return sourceBytes;

  const result = new Uint8Array(sourceBytes.length);
  result.set(sourceBytes); // copy entire file (header + data)

  const srcView = new DataView(sourceBytes.buffer, sourceBytes.byteOffset, sourceBytes.byteLength);
  const dstView = new DataView(result.buffer, result.byteOffset, result.byteLength);

  const { channels, sampleRate } = fmt;
  const frameSize = channels * 2;
  const numFrames = Math.floor(dataSize / frameSize);
  const isStereo = channels >= 2;

  // Filter coefficients for various stem types
  const bassAlpha = lpfAlpha(200, sampleRate);
  const drumHpAlpha = lpfAlpha(400, sampleRate);
  const guitarLpAlpha = lpfAlpha(3000, sampleRate);
  const guitarHpAlpha = lpfAlpha(250, sampleRate);
  const pianoLpAlpha = lpfAlpha(5000, sampleRate);
  const pianoHpAlpha = lpfAlpha(350, sampleRate);

  // IIR filter states
  let lpL = 0, lpR = 0;
  let hpLpL = 0, hpLpR = 0;
  let gLpL = 0, gLpR = 0;
  let gHpL = 0, gHpR = 0;
  let pLpL = 0, pLpR = 0;
  let pHpL = 0, pHpR = 0;

  for (let i = 0; i < numFrames; i++) {
    const off = dataOffset + i * frameSize;
    const left = srcView.getInt16(off, true);
    const right = isStereo ? srcView.getInt16(off + 2, true) : left;

    let outL, outR;

    switch (stemType) {
      case 'vocals': {
        // Center channel isolation (works well for most stereo music)
        const center = (left + right) >> 1;
        outL = center;
        outR = center;
        break;
      }
      case 'bass': {
        // Low-pass filter ~200Hz
        lpL = lpL + bassAlpha * (left - lpL);
        lpR = lpR + bassAlpha * (right - lpR);
        outL = Math.round(lpL);
        outR = Math.round(lpR);
        break;
      }
      case 'drums': {
        // High-pass filter ~400Hz (transients + cymbals + snare)
        hpLpL = hpLpL + drumHpAlpha * (left - hpLpL);
        hpLpR = hpLpR + drumHpAlpha * (right - hpLpR);
        outL = left - Math.round(hpLpL);
        outR = right - Math.round(hpLpR);
        break;
      }
      case 'guitar': {
        // Band-pass 250Hz - 3kHz
        gLpL = gLpL + guitarLpAlpha * (left - gLpL);
        gLpR = gLpR + guitarLpAlpha * (right - gLpR);
        gHpL = gHpL + guitarHpAlpha * (left - gHpL);
        gHpR = gHpR + guitarHpAlpha * (right - gHpR);
        outL = Math.round(gLpL - gHpL);
        outR = Math.round(gLpR - gHpR);
        break;
      }
      case 'piano': {
        // Band-pass 350Hz - 5kHz
        pLpL = pLpL + pianoLpAlpha * (left - pLpL);
        pLpR = pLpR + pianoLpAlpha * (right - pLpR);
        pHpL = pHpL + pianoHpAlpha * (left - pHpL);
        pHpR = pHpR + pianoHpAlpha * (right - pHpR);
        outL = Math.round(pLpL - pHpL);
        outR = Math.round(pLpR - pHpR);
        break;
      }
      case 'other':
      case 'accompaniment': {
        // Side channel (stereo difference = everything except center/vocals)
        if (isStereo) {
          outL = (left - right) >> 1;
          outR = (right - left) >> 1;
        } else {
          outL = left;
          outR = right;
        }
        break;
      }
      default:
        outL = left;
        outR = right;
    }

    // Clamp to int16 range
    outL = outL < -32768 ? -32768 : outL > 32767 ? 32767 : outL;
    outR = outR < -32768 ? -32768 : outR > 32767 ? 32767 : outR;

    dstView.setInt16(off, outL, true);
    if (isStereo) dstView.setInt16(off + 2, outR, true);
  }

  return result;
}
