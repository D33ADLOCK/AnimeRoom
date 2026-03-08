"use client";

import { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { useDropzone } from "react-dropzone";

type UploadState =
  | "idle"
  | "validating"
  | "creating_intent"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

const ACCEPT: Record<
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

const ALLOWED_SIZE = {
  voice_reference: 10 * 1024 * 1024,
  image_reference: 10 * 1024 * 1024,
};

// ── Hardcoded test values ──
const assetType = "voice_reference";
const characterSlot = "character1";
const characterName = "Test Character";
const jobId = "7aaf0bde-d069-4deb-bfba-d8933941d008";

export default function Page() {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

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
    [createUploadIntent, confirmUpload],
  );

  // Dropzone
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT[assetType],
    maxSize: ALLOWED_SIZE[assetType],
    multiple: false,
  });

  return (
    <div
      style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}
    >
      <h2>Upload Test</h2>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#4f8" : "#555"}`,
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#1a2a1a" : "#111",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop it here...</p>
        ) : (
          <p>Drag &amp; drop a file, or click to browse</p>
        )}
        <small>MP3, WAV, M4A — max 10 MB</small>
      </div>

      {/* Status */}
      {state !== "idle" && (
        <p>
          Status: <strong>{state}</strong>
        </p>
      )}
      {error && <p style={{ color: "tomato" }}>{error}</p>}
      {state === "done" && (
        <p style={{ color: "#4f8" }}>✅ Upload confirmed!</p>
      )}
    </div>
  );
}
