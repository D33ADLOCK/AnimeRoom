"use client";

import { useState } from "react";

const MAX_SIZE_MB = 10;

type UploadState =
  | "idle"
  | "validating"
  | "creating_intent"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

export default function Page() {
  const [state, setState] = useState();
  const [error, setError] = useState();
  const [progressPct, setProgressPct] = useState(0);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;

  return <div></div>;
}
