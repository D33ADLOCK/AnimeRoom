import { UPLOAD_URL_EXPIRY } from "~/lib/constant";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import {
  getPreSignedUploadUrl,
  getPresignedReadUrl,
} from "~/lib/storage/genPresignedUrl";
import {
  jobsTable,
  uploadSessionsTable,
  usersAssetsTable,
} from "~/server/db/schema";
import { getObjectMeta } from "~/lib/storage/getItemsR2";
import { and, eq, inArray } from "drizzle-orm";
import {
  createIntentSchema,
  confirmUploadSchema,
  validateMetaData,
  extOf,
  createR2Key,
} from "../helpers/asset.UploadIntent.helpers";
import { ensureJobReference } from "../helpers/asset.confirmUpload.helper";
import z from "zod";
import { flattenRefs } from "../helpers/asset.selectAssetForJob.helper";

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

  confirmUpload: protectedProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Validate the session and userId
        const session = await tx.query.uploadSessionsTable.findFirst({
          where: (t, { and, eq }) =>
            and(eq(t.id, input.sessionId), eq(t.userId, ctx.userId)),
        });

        if (!session)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "unauthorised request",
          });

        // If already confirmed, just ensure the job reference and return
        if (session.status === "confirmed") {
          const existing = await tx.query.usersAssetsTable.findFirst({
            where: (t, { and, eq }) =>
              and(
                eq(t.sourceUploadSessionId, session.id),
                eq(t.userId, ctx.userId),
              ),
          });

          if (existing && session.jobId && session.characterSlot) {
            await ensureJobReference(tx, {
              jobId: session.jobId,
              characterSlot: session.characterSlot,
              assetType: session.assetType,
              assetId: existing.id,
            });

            const previewUrl = await getPresignedReadUrl(session.r2Key);

            return {
              assetId: existing.id,
              label: existing.label,
              previewUrl,
              status: "confirmed" as const,
            };
          }

          const [created] = await tx
            .insert(usersAssetsTable)
            .values({
              id: randomUUID(),
              userId: ctx.userId,
              assetType: session.assetType,
              r2Key: session.r2Key,
              sizeBytes: session.expectedSizeBytes,
              label: input.label,
              sourceUploadSessionId: session.id,
            })
            .returning();

          if (!created)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to recover asset row",
            });

          await ensureJobReference(tx, {
            jobId: session.jobId,
            characterSlot: session.characterSlot!,
            assetType: session.assetType,
            assetId: existing!.id,
          });

          const previewUrl = await getPresignedReadUrl(session.r2Key);

          return {
            assetId: existing!.id,
            label: existing!.label,
            previewUrl,
            status: "confirmed" as const,
          };
        }

        if (
          session.status !== "intent_created" &&
          session.status !== "uploaded_unconfirmed"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid status for confirm: ${session.status}`,
          });
        }

        // Verify file on R2
        const meta = await getObjectMeta(session.bucket, session.r2Key);

        if (meta.contentLength !== session.expectedSizeBytes)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size mismatch",
          });

        if (meta.contentType !== session.expectedContentType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File type mismatch",
          });

        // 1. Mark session as confirmed
        await tx
          .update(uploadSessionsTable)
          .set({ status: "confirmed", confirmedAt: new Date() })
          .where(eq(uploadSessionsTable.id, input.sessionId));

        // 2. Create the permanent asset row
        const [userAsset] = await tx
          .insert(usersAssetsTable)
          .values({
            id: randomUUID(),
            userId: ctx.userId,
            assetType: session.assetType,
            r2Key: session.r2Key,
            sizeBytes: session.expectedSizeBytes,
            label: input.label,
            sourceUploadSessionId: session.id,
          })
          .returning({ id: usersAssetsTable.id });

        if (!userAsset)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create asset",
          });

        // 3. Update job references
        if (session.jobId && session.characterSlot) {
          await ensureJobReference(tx, {
            jobId: session.jobId,
            characterSlot: session.characterSlot,
            assetType: session.assetType,
            assetId: userAsset.id,
          });
        }

        // Generate a presigned read URL for immediate preview
        const previewUrl = await getPresignedReadUrl(session.r2Key);

        return {
          assetId: userAsset.id,
          label: input.label,
          previewUrl,
          status: "confirmed" as const,
        };
      });
    }),

  listMyAssets: protectedProcedure.query(async ({ ctx }) => {
    const assets = await ctx.db.query.usersAssetsTable.findMany({
      where: (t, { eq }) => eq(t.userId, ctx.userId),
      columns: { id: true, assetType: true, r2Key: true, label: true },
    });

    if (assets.length === 0)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No asset found for the user",
      });

    const assetsWithUrl = await Promise.all(
      assets.map(async (a) => {
        const url = await getPresignedReadUrl(a.r2Key!);

        return { id: a.id, assetType: a.assetType, url, label: a.label };
      }),
    );

    const imageAssets = assetsWithUrl.filter(
      (a) => a.assetType === "image_reference",
    );
    const voiceAssets = assetsWithUrl.filter(
      (a) => a.assetType === "voice_reference",
    );

    return { imageAssets, voiceAssets };
  }),

  selectAssetForJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string().min(1),
        references: z.object({
          character1: z.object({
            voiceAssetId: z.string().min(1).nullable(),
            imageAssetId: z.string().min(1).nullable(),
          }),
          character2: z.object({
            voiceAssetId: z.string().min(1).nullable(),
            imageAssetId: z.string().min(1).nullable(),
          }),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const verify = await ctx.db.query.jobsTable.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.userId, ctx.userId), eq(t.id, input.jobId)),
        columns: { jobStatus: true },
      });

      if (!verify)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Failed to verify the user",
        });

      const toValidate = flattenRefs(input.references);

      if (toValidate.length > 0) {
        const allIds = toValidate.map((r) => r.assetId);

        const validAssets = await ctx.db.query.usersAssetsTable.findMany({
          where: (t, { and, eq, inArray }) =>
            and(eq(t.userId, ctx.userId), inArray(t.id, allIds)),
          columns: { id: true },
        });

        const validIds = new Set(validAssets.map((a) => a.id));
        const failedRefs = toValidate.filter((i) => !validIds.has(i.assetId));

        if (failedRefs.length > 0)
          return { success: false as const, failed: failedRefs };
      }

      const updated = await ctx.db
        .update(jobsTable)
        .set({ assetReferences: input.references })
        .where(
          and(eq(jobsTable.id, input.jobId), eq(jobsTable.userId, ctx.userId)),
        )
        .returning({ id: jobsTable.id });

      if (!updated)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update the assets",
        });

      return { success: true as const, id: updated };
    }),
});
