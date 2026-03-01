import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./client";

export async function saveBufferToR2(file: Buffer, fileName: string) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL!;
  const BUCKET = process.env.R2_BUCKET_NAME!;

  const publicURL = `${baseUrl}/${fileName}`;

  const getContentType = (key: string) => {
    if (key.endsWith(".mp3")) return "audio/mpeg";
    if (key.endsWith(".png")) return "image/png";
    if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: file,
      ContentType: getContentType(fileName),
    }),
  );

  return publicURL;
}
