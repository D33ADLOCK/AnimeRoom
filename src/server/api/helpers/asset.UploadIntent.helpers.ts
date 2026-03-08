import z from "zod";
import { createHmac } from "crypto";
import { TRPCError } from "@trpc/server";
import path from "path";

// ── Schemas ──

export const createIntentSchema = z.object({
  jobId: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  oldName: z.string(),
  characterName: z.string(),
  characterSlot: z.enum(["character1", "character2"]),
  assetType: z.enum(["voice_reference", "image_reference"]),
});

export const confirmUploadSchema = z.object({
  sessionId: z.string(),
  label: z.string(),
});

// ── Constants ──

export const ALLOWED_MIME = {
  voice_reference: new Set(["audio/mpeg", "audio/wav", "audio/mp4"]),
  image_reference: new Set(["image/png", "image/jpeg", "image/webp"]),
};

export const ALLOWED_EXT = {
  voice_reference: new Set(["mp3", "wav", "m4a"]),
  image_reference: new Set(["png", "jpg", "jpeg", "webp"]),
};

export const ALLOWED_SIZE = {
  voice_reference: 10 * 1024 * 1024,
  image_reference: 10 * 1024 * 1024,
};

// ── Helpers ──

export const extOf = (fileName: string) => {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) : "";
};

export const validateMetaData = (input: z.infer<typeof createIntentSchema>) => {
  const mimeOk = ALLOWED_MIME[input.assetType].has(input.contentType);
  const extOk = ALLOWED_EXT[input.assetType].has(extOf(input.oldName)!);
  const sizeOk = input.fileSize <= ALLOWED_SIZE[input.assetType];

  if (!mimeOk || !extOk || !sizeOk) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file type, extension, or size.",
    });
  }
};

export const userPrefix = (userId: string) => {
  return createHmac("sha256", process.env.R2_KEY_SALT ?? "dev-salt")
    .update(userId)
    .digest("hex")
    .slice(0, 16);
};

export const createR2Key = (userId: string, sessionId: string, ext: string) => {
  const userHash = userPrefix(userId);
  return path.posix.join("references", userHash, `${sessionId}.${ext}`);
};
