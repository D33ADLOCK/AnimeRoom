import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./client";

export async function saveToR2UsingUrl({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL!;
  const BUCKET = process.env.R2_BUCKET_NAME!;

  const publicUrl = `${baseUrl}/${fileName}`;

  console.log("R2 Called");

  const res = await fetch(url);

  if (!res.ok)
    throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);

  const headerType = res.headers.get("content-type");

  console.log(res.ok);

  const getContentType = (key: string) => {
    if (key.endsWith(".mp3")) return "audio/mpeg";
    if (key.endsWith(".png")) return "image/png";
    if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
  };

  const contentType = headerType ?? getContentType(fileName);
  console.log("Content type: ", contentType);

  const arrayBuffer = await res.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: fileName,
      Body: body,
      ContentType: contentType,
    }),
  );

  console.log("status.ok");

  return publicUrl;
}
