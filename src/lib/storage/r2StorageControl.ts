import { readFile } from "fs/promises";
import { s3 } from "./r2";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";

const imagePath = path.resolve(
  process.cwd(), // project root (where you run pnpm from)
  "remotion/public/images/gogeta-front-trimmed.png",
);

const buffer = await readFile(imagePath);

// await s3.send(
//   new PutObjectCommand({
//     Bucket: "animeroom",
//     Key: "gogeta-front-trimmed.png",
//     Body: buffer,
//     ContentType: "image/png",
//   }),
// );

export const getTempUrl = async () => {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: "animeroom",
      Key: "gogeta-front-trimmed.png",
    }),
    { expiresIn: 3600 },
  );
};
