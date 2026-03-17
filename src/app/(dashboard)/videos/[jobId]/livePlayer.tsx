"use client";

import { useState } from "react";
import type { LiveStateType } from "~/lib/pipeline/createEmptyPreviewState";
import { LivePreview } from "./_components/live/livePreview";
import { useRealtime } from "~/lib/redis/realtime-client";
import LiveEditor from "./_components/live/liveEditor";

export default function LivePlayer() {
  const [liveState, setLiveState] = useState<null | LiveStateType>(null);

  useRealtime({
    events: ["pipeline-events"],
    onData: ({ event, data }) => {
      console.log(`Received ${event}:`, data);

      if (data.type === "previewUpdate") {
        setLiveState(data);
      }
    },
  });

  return (
    <div className="flex gap-4 px-8">
      {/* Editor Area */}
      {liveState && <LiveEditor liveState={liveState} />}

      {/* Preview Player - sticky on the right */}
      <div className="top-4 h-fit w-1/3 shrink">
        <div className="border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[6px_6px_0px_var(--color-nb-shadow)]">
          {liveState && <LivePreview liveState={liveState} />}
        </div>
      </div>
    </div>
  );
}
