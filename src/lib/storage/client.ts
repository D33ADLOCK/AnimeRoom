// Cloudflare R2 Storage Client
// TODO: Set up R2 client with @aws-sdk/client-s3
import { S3Client } from "@aws-sdk/client-s3";

import "dotenv/config";
import { env } from "~/env";

const accessKeyId = env.R2_Access_Key_ID;
const secretAccessKey = env.R2_Secret_Access_Key;

export const s3 = new S3Client({
  region: "auto",
  endpoint: "https://93b5e52d46713e94ce36b96000f1d91f.r2.cloudflarestorage.com",

  credentials: {
    // Provide your R2 Access Key ID and Secret Access Key
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});
