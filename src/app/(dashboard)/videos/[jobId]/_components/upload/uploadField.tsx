"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ALLOWED_SIZE } from "~/lib/constant";
import { api } from "~/trpc/react";

type UploadFieldProp = {
  characterName: string;
  characterSlot: "character1" | "character2";
  assetType: "voice_reference" | "image_reference";
  jobId: string;
};

type UploadState =
  | "idle"
  | "validating"
  | "creating_intent"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

const ACCEPT_ASSET_TYPE: Record<
  "voice_reference" | "image_reference",
  Record<string, string[]>
> = {
  voice_reference: {
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "audio/mp4": [".m4a"],
  },
  image_reference: {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
  },
};

export const UploadField = ({
  characterName,
  characterSlot,
  assetType,
  jobId,
}: UploadFieldProp) => {
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
            assetType,
            characterName,
            characterSlot,
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
          await confirmUpload({
            sessionId,
            label: characterName,
          });

          setState("done");
        } catch (e) {
          setState("error");
          setError(e instanceof Error ? e.message : "Upload failed");
        }
      };

      void handleFileSelect();
    },
    [
      createUploadIntent,
      confirmUpload,
      assetType,
      characterName,
      characterSlot,
      jobId,
    ],
  );

  // Dropzone
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_ASSET_TYPE[assetType],
    maxSize: ALLOWED_SIZE[assetType],
    multiple: false,
  });

  return <div></div>;
};
