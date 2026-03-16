"use client";

import { useEffect, useRef, useState } from "react";
import { useRealtime } from "~/lib/redis/realtime-client";
import { api } from "~/trpc/react";
import type { LivePreviewStateSchema } from "~/lib/realtime/job-event";
import { Player } from "@remotion/player";
import LiveComposition from "~/remotion/liveComposition";
import type { LiveStateType } from "~/lib/pipeline/createEmptyPreviewState";

export default function Page() {
  const [liveState, setLiveState] = useState<null | LiveStateType>(null);

  const hasFired = useRef(false);

  const { mutateAsync: startLivePipeline } =
    api.job.createLivePipeline.useMutation();

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    void startLivePipeline({
      jobId: "124",
      prompt: "Generate a roast battle between naruto and Sasuke",
    });
  }, []);

  useRealtime({
    events: ["pipeline-events"],
    onData: ({ event, data }) => {
      console.log(`Received ${event}:`, data);

      // We expect the data to be the LiveStateType (which matches LivePreviewStateSchema)
      if (data.type === "previewUpdate") {
        setLiveState(data);
      }
    },
  });

  return (
    <div
      style={{
        width: "min(420px, 100%)",
        aspectRatio: "9 / 16",
        margin: "0 auto",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {liveState && liveState.data.totalDurationFrames > 0 && (
        <Player
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          component={LiveComposition}
          inputProps={{ props: liveState }}
          fps={30}
          durationInFrames={liveState.data.totalDurationFrames}
          compositionHeight={1920}
          compositionWidth={1080}
          loop
          controls
        />
      )}
    </div>
  );
}
