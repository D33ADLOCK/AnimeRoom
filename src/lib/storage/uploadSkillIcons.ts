/**
 * uploadSkillIcons.ts
 *
 * Uploads skill icon images to R2 under common/images/.
 *
 * Run with:  pnpm exec tsx src/lib/storage/uploadSkillIcons.ts
 */

import { readFile } from "fs/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { s3 } from "./client";
import { env } from "~/env";

const BUCKET = env.R2_BUCKET_NAME;
const BASE_URL = env.R2_PUBLIC_BASE_URL;
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const SKILL_ICONS = [
  {
    localPath: "skill1-trimmed.png",
    r2Key: "common/images/skill1.png",
    contentType: "image/png",
  },
  {
    localPath: "skill2-trimmed.png",
    r2Key: "common/images/skill2.png",
    contentType: "image/png",
  },
  {
    localPath: "skill3-trimmed.png",
    r2Key: "common/images/skill3.png",
    contentType: "image/png",
  },
];

async function uploadAsset(asset: (typeof SKILL_ICONS)[number]) {
  const fullPath = path.join(PUBLIC_DIR, asset.localPath);
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

console.log("⬆️  Uploading skill icons to R2...\n");

const results = await Promise.all(SKILL_ICONS.map(uploadAsset));

console.log("\n📋 Skill icon URLs:");
console.log(JSON.stringify(results, null, 2));
