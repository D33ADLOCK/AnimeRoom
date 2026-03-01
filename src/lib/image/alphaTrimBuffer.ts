import sharp from "sharp";

/**
 * Takes an image buffer (with alpha/transparency), finds the bounding box
 * of non-transparent pixels, crops to that box + padding, returns a PNG buffer.
 */
export async function alphaTrimBuffer(
  input: Buffer<ArrayBuffer>,
  pad = 20,
  alphaThreshold = 10,
): Promise<Buffer> {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * channels + 3];
      if ((a ?? 0) >= alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If fully transparent, return input as-is
  if (maxX < 0) return input;

  // Expand bbox by padding, clamped to image bounds
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const extractW = maxX - minX + 1;
  const extractH = maxY - minY + 1;

  return sharp(input)
    .extract({ left: minX, top: minY, width: extractW, height: extractH })
    .png()
    .toBuffer();
}
