/**
 * Converts a float32 WAV buffer to a PCM int16 WAV buffer.
 * Pure JS — zero dependencies, works in any runtime.
 *
 * Float32 WAV = format code 3, samples are floats in [-1.0, 1.0]
 * PCM16 WAV   = format code 1, samples are int16 in [-32768, 32767]
 */
export function float32WavToPcm16(input: Buffer): Buffer {
  // Read WAV header fields
  const riff = input.toString("ascii", 0, 4);
  const wave = input.toString("ascii", 8, 12);

  if (riff !== "RIFF" || wave !== "WAVE") {
    // Not a WAV file — return as-is (might be MP3 or other format)
    return input;
  }

  const audioFormat = input.readUInt16LE(20);

  if (audioFormat === 1) {
    // Already PCM — nothing to do
    return input;
  }

  if (audioFormat !== 3) {
    // Not float32 either — return as-is and let downstream handle it
    console.warn(
      `⚠️  Unknown WAV format code: ${audioFormat}, skipping conversion`,
    );
    return input;
  }

  const numChannels = input.readUInt16LE(22);
  const sampleRate = input.readUInt32LE(24);
  const bitsPerSample = input.readUInt16LE(34);

  if (bitsPerSample !== 32) {
    console.warn(`⚠️  Expected 32-bit float, got ${bitsPerSample}-bit`);
    return input;
  }

  // Find the "data" chunk
  let dataOffset = 12;
  let dataSize = 0;

  while (dataOffset < input.length - 8) {
    const chunkId = input.toString("ascii", dataOffset, dataOffset + 4);
    const chunkSize = input.readUInt32LE(dataOffset + 4);

    if (chunkId === "data") {
      dataOffset += 8; // skip chunk header
      dataSize = chunkSize;
      break;
    }

    dataOffset += 8 + chunkSize;
  }

  if (dataSize === 0) {
    console.warn("⚠️  No data chunk found in WAV");
    return input;
  }

  // Convert float32 samples → int16
  const numSamples = dataSize / 4; // 4 bytes per float32
  const pcmData = Buffer.alloc(numSamples * 2); // 2 bytes per int16

  for (let i = 0; i < numSamples; i++) {
    const floatVal = input.readFloatLE(dataOffset + i * 4);

    // Clamp to [-1, 1] then scale to int16 range
    const clamped = Math.max(-1, Math.min(1, floatVal));
    const int16Val = Math.round(clamped * 32767);

    pcmData.writeInt16LE(int16Val, i * 2);
  }

  // Build new WAV header (44 bytes) + PCM data
  const pcmDataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmDataSize, 4); // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * 2, 28); // byte rate
  header.writeUInt16LE(numChannels * 2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcmDataSize, 40);

  return Buffer.concat([header, pcmData]);
}
