import { eq } from "drizzle-orm";
import type { db } from "~/server/db";
import { jobsTable, type AssetReferences } from "~/server/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const ensureJobReference = async (
  tx: Tx,
  args: {
    jobId: string;
    characterSlot: "character1" | "character2";
    assetType: "voice_reference" | "image_reference";
    assetId: string;
  },
) => {
  const job = await tx.query.jobsTable.findFirst({
    where: (t, { eq }) => eq(t.id, args.jobId),
    columns: { assetReferences: true },
  });

  const refs: AssetReferences = job?.assetReferences ?? {};
  const refKey =
    args.assetType === "voice_reference" ? "voiceAssetId" : "imageAssetId";

  refs[args.characterSlot] = {
    ...(refs[args.characterSlot] ?? {}),
    [refKey]: args.assetId,
  };

  await tx
    .update(jobsTable)
    .set({ assetReferences: refs })
    .where(eq(jobsTable.id, args.jobId));
};
