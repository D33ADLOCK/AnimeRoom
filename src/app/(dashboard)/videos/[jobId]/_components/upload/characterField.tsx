import React, { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { AssetDropdown } from "./dropdown";
import { api } from "~/trpc/react";
import { useDropzone } from "react-dropzone";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Types
type AssetSelections = {
  assetId: string;
  label: string;
  previewUrl: string;
} | null;

type UploadState =
  | "idle"
  | "validating"
  | "creating_intent"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

type CharacterField = {
  myAudioAssets: {
    id: string;
    url: string;
    label: string;
  }[];
  characterSelectedAsset: AssetSelections;
  onSelect: (
    slot: "character1" | "character2",
    selectedAsset: AssetSelections,
  ) => void;
  slot: "character1" | "character2";
  characterName: string;
  jobId: string;
};

// Constants
const ACCEPT_FORMAT = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/mp4": [".m4a"],
};

const ALLOWED_SIZE = 10 * 1024 * 1024;

export function CharacterField({
  myAudioAssets,
  characterSelectedAsset,
  onSelect,
  slot,
  characterName = "Vegito",
  jobId,
}: CharacterField) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<null | string>(null);

  const { mutateAsync: createUploadIntent } =
    api.asset.createUploadIntent.useMutation();

  const { mutateAsync: confirmUpload } = api.asset.confirmUpload.useMutation();

  // Upload File on Client End
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const handleFileSelect = async () => {
        try {
          setError(null);
          setState("creating_intent");

          const { sessionId, uploadUrl } = await createUploadIntent({
            fileSize: file.size,
            jobId,
            contentType: file.type,
            assetType: "voice_reference",
            characterName,
            characterSlot: slot,
            oldName: file.name,
          });

          setState("uploading");

          const res = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!res.ok) {
            setState("error");
            setError("Failed to upload to R2");
            return;
          }

          setState("confirming");
          const assetUploaded = await confirmUpload({
            sessionId,
            label: characterName,
          });

          const onSelectProp = {
            assetId: assetUploaded.assetId,
            label: assetUploaded.label!,
            previewUrl: assetUploaded.previewUrl,
          };

          onSelect(slot, onSelectProp);

          setState("done");
        } catch (e) {
          setState("error");
          setError(e instanceof Error ? e.message : "Upload failed");
        }
      };

      void handleFileSelect();
    },
    [createUploadIntent, confirmUpload, onSelect, characterName, slot, jobId],
  );

  // Dropzone
  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT_FORMAT,
    maxSize: ALLOWED_SIZE,
    multiple: false,
    noClick: true,
  });

  const isUploading =
    state === "creating_intent" ||
    state === "uploading" ||
    state === "confirming";

  return (
    <div
      {...getRootProps()}
      className={`nb-card flex flex-col gap-5 p-6 transition-all ${
        isDragActive
          ? "border-[var(--color-nb-blue)] bg-blue-50 shadow-[6px_6px_0px_var(--color-nb-blue)]"
          : "bg-white"
      }`}
    >
      <input {...getInputProps()} />

      {/* Character Name Header */}
      <div className="nb-border bg-[var(--color-nb-yellow)] px-4 py-3 text-center">
        <h2 className="text-lg font-extrabold tracking-wide uppercase">
          {characterName}
        </h2>
      </div>

      {/* Drag indicator */}
      {isDragActive && (
        <div className="nb-border flex items-center justify-center bg-[var(--color-nb-blue)]/20 py-8">
          <p className="text-sm font-extrabold text-[var(--color-nb-blue)] uppercase">
            Drop audio file here
          </p>
        </div>
      )}

      {/* Controls: Dropdown + Upload Button */}
      {!isDragActive && (
        <>
          <div className="flex w-full items-center gap-3 overflow-hidden">
            <div className="min-w-0 flex-1">
              <AssetDropdown
                myAudioAssets={myAudioAssets}
                characterSelectedAsset={characterSelectedAsset}
                onSelect={onSelect}
                slot={slot}
              />
            </div>

            <button
              type="button"
              onClick={() => open()}
              disabled={isUploading}
              className="nb-btn flex shrink-0 items-center gap-2 bg-white px-4 py-2 text-xs disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {/* Upload Status */}
          {state === "done" && (
            <div className="nb-border flex items-center gap-2 bg-green-100 px-3 py-2 text-xs font-bold text-green-700">
              <CheckCircle className="h-4 w-4" />
              Uploaded successfully
            </div>
          )}
          {state === "error" && error && (
            <div className="nb-border flex items-center gap-2 bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Audio Preview */}
          <div className="nb-border flex min-h-[70px] items-center justify-center bg-[var(--color-nb-bg)] p-4">
            {characterSelectedAsset?.previewUrl ? (
              <audio
                controls
                src={characterSelectedAsset.previewUrl}
                className="w-full"
              />
            ) : (
              <span className="text-xs font-semibold text-[var(--color-nb-text)]/40 uppercase">
                No voice selected — will use default
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
