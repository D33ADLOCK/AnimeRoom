import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./client";

export async function getObjectMeta(bucket: string, key: string) {
  const data = await s3.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  return {
    contentLength: data.ContentLength,
    contentType: data.ContentType,
  };
}
