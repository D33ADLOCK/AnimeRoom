import { UPLOAD_URL_EXPIRY } from "~/lib/constant";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import z from "zod";
import { createHmac, randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import path from "path";
import { getPreSignedUploadUrl } from "~/lib/storage/genPresignedUrl";
import { uploadSessionsTable } from "~/server/db/schema";

const createIntentSchema = z.object({
  jobId: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  oldName: z.string(),
  characterName: z.string(),
  characterSlot: z.enum(["character1", "character2"]),
  assetType: z.enum(["voice_reference", "image_reference"]),
});

const ALLOWED_MIME = {
  voice_reference: new Set(["audio/mpeg", "audio/wav", "audio/mp4"]),
  image_reference: new Set(["image/png", "image/jpeg", "image/webp"]),
};

const ALLOWED_EXT = {
  voice_reference: new Set(["mp3", "wav", "m4a"]),
  image_reference: new Set(["png", "jpg", "jpeg", "webp"]),
};

const ALLOWED_SIZE = {
  voice_reference: 10 * 1024 * 1024,
  image_reference: 10 * 1024 * 1024,
};

const extOf = (fileName: string) => {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) : "";
};

const validateMetaData = (input: z.infer<typeof createIntentSchema>) => {
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

const userPrefix = (userId: string) => {
  return createHmac("sha256", process.env.R2_KEY_SALT ?? "dev-salt")
    .update(userId)
    .digest("hex")
    .slice(0, 16);
};

const createR2Key = (userId: string, sessionId: string, ext: string) => {
  const userHash = userPrefix(userId);
  return path.posix.join("references", userHash, `${sessionId}.${ext}`);
};

// TRPC

export const assetsRouter = createTRPCRouter({
  createUploadIntent: protectedProcedure
    .input(createIntentSchema)
    .mutation(async ({ ctx, input }) => {
      validateMetaData(input);

      const sessionId = randomUUID();
      const userId = ctx.userId;
      const fileExt = extOf(input.oldName);

      const bucket = process.env.R2_BUCKET_NAME ?? "animeroom";

      const verify = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.id, input.jobId), eq(t.userId, userId)),
        columns: { id: true },
      });

      if (!verify)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized user",
        });

      const r2Key = createR2Key(userId, sessionId, fileExt!);

      const expiresAt = new Date(Date.now() + UPLOAD_URL_EXPIRY * 1000);

      const uploadUrl = await getPreSignedUploadUrl(r2Key);

      const [session] = await ctx.db
        .insert(uploadSessionsTable)
        .values({
          id: sessionId,
          bucket,
          userId,
          assetType: input.assetType,
          characterSlot: input.characterSlot,
          originalFilename: input.oldName,
          presignedUrlExpiresAt: expiresAt,
          r2Key,
          jobId: input.jobId,
          expectedContentType: input.contentType,
          expectedSizeBytes: input.fileSize,
          status: "intent_created",
        })
        .returning({
          uploadId: uploadSessionsTable.id,
        });

      if (!session)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create session",
        });

      return {
        sessionId: session.uploadId,
        uploadUrl,
        r2Key,
      };
    }),
});
