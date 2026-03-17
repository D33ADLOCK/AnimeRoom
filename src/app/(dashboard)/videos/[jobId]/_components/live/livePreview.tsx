"use client";

import { Player } from "@remotion/player";
import LiveComposition from "~/remotion/liveComposition";
import type { LiveStateType } from "~/lib/pipeline/createEmptyPreviewState";

export function LivePreview({ liveState }: { liveState: LiveStateType }) {
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
