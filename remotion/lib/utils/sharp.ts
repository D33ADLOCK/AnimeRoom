import sharp from "sharp";
import fs from "node:fs/promises";

export async function alphaTrim(
  inPath: string,
  outPath: string,
  pad = 20,
  alphaThreshold = 10,
) {
  const img = sharp(inPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels should be 4 (RGBA)
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

  // If fully transparent, just copy
  if (maxX < 0) {
    await fs.copyFile(inPath, outPath);
    return;
  }

  // Expand bbox by padding, clamped to image bounds
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const extractW = maxX - minX + 1;
  const extractH = maxY - minY + 1;

  await sharp(inPath)
    .extract({ left: minX, top: minY, width: extractW, height: extractH })
    .png()
    .toFile(outPath);
}
