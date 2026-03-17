"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { CharacterField } from "./characterField";
import { fa } from "zod/v4/locales";

type SlotState = {
  assetId: string;
  label: string;
  previewUrl: string;
} | null;

type AssetSelections = {
  character1: {
    voice: SlotState;
  };
  character2: {
    voice: SlotState;
  };
};

type UploadAssetFieldProps = {
  jobId: string;
  character1Name?: string;
  character2Name?: string;
  // onContinue?: (selections: AssetSelections) => void;
  onSkip?: () => void;
};

const buildRef = (slot: AssetSelections["character1"]) => ({
  imageAssetId: null,
  voiceAssetId: slot.voice?.assetId ?? null,
});

export const UploadAssetField = ({
  jobId,
  character1Name = "Character 1",
  character2Name = "Character 2",
  // onContinue,
}: UploadAssetFieldProps) => {
  const [selectedAssets, setSelectedAssets] = useState<AssetSelections>({
    character1: { voice: null },
    character2: { voice: null },
  });

  const [error, setError] = useState<string | null>(null);
  const [failedRed, setFailedRef] = useState<Set<string>>(new Set());

  const { data: listMyAssets } = api.asset.listMyAssets.useQuery();
  const { mutateAsync: saveRefToJob } =
    api.asset.selectAssetForJob.useMutation();
  const { mutateAsync: continuePipeline } =
    api.job.continuePipeline.useMutation();

  // if (!listMyAssets) throw new Error("No assets found for the user")

  const myAudioAssets = listMyAssets?.voiceAssets ?? [];

  const handleSelect = (
    slot: "character1" | "character2",
    selectedAsset: SlotState,
  ) => {
    setSelectedAssets((p) => ({
      ...p,
      [slot]: {
        ...p[slot],
        voice: selectedAsset,
      },
    }));
  };

  const onContinue = async () => {
    setFailedRef(new Set());

    const ref = {
      character1: buildRef(selectedAssets.character1),
      character2: buildRef(selectedAssets.character2),
    };

    const failedRef = await saveRefToJob({ jobId: jobId, references: ref });

    if (!failedRef.success) {
      const failed = failedRef.failed;
      setFailedRef(new Set(failed.map((m) => m.assetId)));

      return;
    }

    void continuePipeline({ jobId });
  };

  const onSkip = () => {
    void continuePipeline({ jobId });
  };

  return (
    <div className="flex flex-col items-center gap-8 px-8 py-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-wide uppercase">
          Select Voice References
        </h1>
        <p className="mt-1 text-sm font-semibold text-[var(--color-nb-text)]/60">
          Upload or choose a voice reference for each character
        </p>
      </div>

      {/* Two-column character grid */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <CharacterField
          myAudioAssets={myAudioAssets}
          characterSelectedAsset={selectedAssets.character1.voice}
          onSelect={handleSelect}
          slot="character1"
          characterName={character1Name}
          jobId={jobId}
        />
        <CharacterField
          myAudioAssets={myAudioAssets}
          characterSelectedAsset={selectedAssets.character2.voice}
          onSelect={handleSelect}
          slot="character2"
          characterName={character2Name}
          jobId={jobId}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onSkip}
          className="nb-btn bg-white px-6 py-3 text-sm"
        >
          Skip — Use Defaults
        </button>
        <button
          type="button"
          onClick={() => onContinue()}
          className="nb-btn bg-[var(--color-nb-yellow)] px-8 py-3 text-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};
