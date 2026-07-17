import { readFile } from "fs/promises";
import { s3 } from "./client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import { env } from "~/env";

const BUCKET = env.R2_BUCKET_NAME;
const REFERENCE_KEY = "gogeta-front-trimmed.png";

/**
 * Uploads a local file to R2 and returns its public URL.
 * Primarily used to (re)upload the reference image used by Replicate.
 */
export const uploadLocalImageToR2 = async (
  localRelativePath: string,
  r2Key: string,
) => {
  const baseUrl = env.R2_PUBLIC_BASE_URL;
  const fullPath = path.resolve(process.cwd(), localRelativePath);
  const body = await readFile(fullPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: body,
      ContentType: "image/png",
    }),
  );

  const publicUrl = `${baseUrl}/${r2Key}`;
  console.log(`✅ Uploaded to R2: ${r2Key}`);
  return publicUrl;
};

/**
 * Returns a short-lived signed URL for the reference character image.
 * Replicate needs a publicly accessible URL to use as image input.
 */
export const getTempUrl = async () => {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: REFERENCE_KEY }),
    { expiresIn: 3600 },
  );
};
