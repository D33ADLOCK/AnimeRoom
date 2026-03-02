import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET_NAME!;

const getContentType = (key: string) => {
  const k = key.toLowerCase();

  if (k.endsWith(".mp3")) return "audio/mpeg";
  if (k.endsWith(".wav")) return "audio/wav";
  if (k.endsWith(".m4a")) return "audio/mp4";

  if (k.endsWith(".png")) return "image/png";
  if (k.endsWith(".jpg") || k.endsWith(".jpeg")) return "image/jpeg";

  return "application/octet-stream";
};

export async function getPreSignedUploadUrl(key: string) {
  return await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: getContentType(key),
    }),
  );
}
