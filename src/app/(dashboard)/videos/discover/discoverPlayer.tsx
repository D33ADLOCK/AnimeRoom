import { Player, type PlayerRef } from "@remotion/player";
import React, { useEffect, useRef } from "react";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import LiveComposition from "~/remotion/liveComposition";

type DiscoverPlayerType = {
  videoManifest: LiveStateType;
  isActive: boolean;
};

export default function DiscoverPlayer({
  videoManifest,
  isActive,
}: DiscoverPlayerType) {
  const playerRef = useRef<PlayerRef>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleProgressbar = () => {
      const frame = player.getCurrentFrame();
      const total = videoManifest.data.totalDurationFrames;
      const progress = (frame / total) * 100;

      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }
    };

    player.addEventListener("timeupdate", handleProgressbar);
    return () => player.removeEventListener("timeupdate", handleProgressbar);
  }, [videoManifest.data.totalDurationFrames]);

  useEffect(() => {
    if (isActive) {
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
    } else {
      playerRef.current?.seekTo(0);
      playerRef.current?.pause();
    }
  }, [isActive]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Player
        ref={playerRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        component={LiveComposition}
        inputProps={{ props: videoManifest }}
        fps={30}
        durationInFrames={videoManifest.data.totalDurationFrames}
        compositionHeight={1920}
        compositionWidth={1080}
        loop
        autoPlay={isActive}
        clickToPlay
      />

      {/* Progress bar */}
      <div className="absolute right-0 bottom-0 left-0 h-1 bg-white/20">
        <div
          ref={progressRef}
          className="h-full bg-[var(--color-nb-mint)]"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
}
