import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function saveStreamToFile(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  filePath: string,
) {
  await mkdir(path.dirname(filePath), { recursive: true });

  const nodeStream =
    "getReader" in stream ? Readable.fromWeb(stream as any) : stream;

  await pipeline(nodeStream, createWriteStream(filePath));

  return filePath;
}
