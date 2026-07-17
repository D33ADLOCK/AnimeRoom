/**
 * uploadCommonAssets.ts
 *
 * One-time script to upload static/shared assets (announcer image, background,
 * announcer audio clips) to R2 under the `common/` prefix.
 *
 * Run with:  pnpm exec tsx src/lib/storage/uploadCommonAssets.ts
 */

import { readFile } from "fs/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { s3 } from "./client";
import { env } from "~/env";

const BUCKET = env.R2_BUCKET_NAME;
const BASE_URL = env.R2_PUBLIC_BASE_URL;
const REMOTION_PUBLIC = path.resolve(process.cwd(), "remotion/public");

// ─── Asset manifest ───────────────────────────────────────────────────────────
// Add or remove entries here as needed.

const ASSETS = [
  {
    localPath: "images/announcer-image.png",
    r2Key: "common/images/announcer-image.png",
    contentType: "image/png",
  },
  {
    localPath: "images/background.png",
    r2Key: "common/images/background.png",
    contentType: "image/png",
  },
  {
    localPath: "audio/announcer/announcer-opening-2.mp3",
    r2Key: "common/audio/announcer/announcer-opening-2.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/announcer-opening-3.mp3",
    r2Key: "common/audio/announcer/announcer-opening-3.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/announcer-opening-4.mp3",
    r2Key: "common/audio/announcer/announcer-opening-4.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/dbz-announcer/dbz-announcer-opening-1.mp3",
    r2Key: "common/audio/announcer/dbz-announcer-opening-1.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/dbz-announcer/dbz-announcer-opening-2.mp3",
    r2Key: "common/audio/announcer/dbz-announcer-opening-2.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/dbz-announcer/dbz-announcer-opening-3.mp3",
    r2Key: "common/audio/announcer/dbz-announcer-opening-3.mp3",
    contentType: "audio/mpeg",
  },
  {
    localPath: "audio/announcer/dbz-announcer/dbz-announcer-opening-4.mp3",
    r2Key: "common/audio/announcer/dbz-announcer-opening-4.mp3",
    contentType: "audio/mpeg",
  },
];

// ─── Upload ───────────────────────────────────────────────────────────────────

async function uploadAsset(asset: (typeof ASSETS)[number]) {
  const fullPath = path.join(REMOTION_PUBLIC, asset.localPath);
  const body = await readFile(fullPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: asset.r2Key,
      Body: body,
      ContentType: asset.contentType,
    }),
  );

  const publicUrl = `${BASE_URL}/${asset.r2Key}`;
  console.log(`  ✅ ${asset.r2Key}`);
  console.log(`     ${publicUrl}`);
  return { key: asset.r2Key, publicUrl };
}

console.log("⬆️  Uploading common assets to R2...\n");

const results = await Promise.all(ASSETS.map(uploadAsset));

console.log("\n📋 Common asset URLs:");
console.log(JSON.stringify(results, null, 2));
