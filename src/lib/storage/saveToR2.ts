import { s3 } from "./r2";
import { Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";

export async function saveStreamToR2(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  filePath: string,
) {
  const bucketName = process.env.R2_BUCKET_NAME!;
  const baseUrl = process.env.R2_PUBLIC_BASE_URL!;

  const publicURL = `${baseUrl}/${filePath}`;

  const getContentType = (key: string) => {
    if (key.endsWith(".mp3")) return "audio/mpeg";
    if (key.endsWith(".png")) return "image/png";
    if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
  };

  const isWebStream = (
    s: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  ): s is ReadableStream<Uint8Array> => {
    return typeof (s as ReadableStream<Uint8Array>).getReader === "function";
  };

  const body: NonNullable<PutObjectCommandInput["Body"]> = isWebStream(stream)
    ? Readable.fromWeb(stream as unknown as NodeWebReadableStream)
    : stream;

  const upload = new Upload({
    client: s3,
    params: {
      Body: body,
      Bucket: bucketName,
      Key: filePath,
      ContentType: getContentType(filePath),
    },
  });

  await upload.done();

  console.log(`${filePath} has been successfully uploaded on r2`);

  return publicURL;
}
