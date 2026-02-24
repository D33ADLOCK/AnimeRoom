"use client";

import { Player } from "@remotion/player";
import React from "react";
import { MyComposition } from "~/remotion/Composition";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";

type PreviewPlayerProp = {
  playerProps: PrepareVideoPropsType;
  totalDuration: number;
};

export const PreviewPlayer = ({
  playerProps,
  totalDuration,
}: PreviewPlayerProp) => {
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
      <Player
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        component={MyComposition}
        inputProps={playerProps}
        fps={30}
        durationInFrames={totalDuration}
        compositionHeight={1920}
        compositionWidth={1080}
        loop
        controls
      />
    </div>
  );
};
