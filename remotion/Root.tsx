import "./index.css";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { MyComposition } from "./Composition";
import type { MyCompositionProps } from "./Composition";
import { registerRoot } from "remotion";
import {
  audioDuration,
  prepareVideoProps,
} from "./prepareVideoProps";
import { dummyManifest } from "./dummyManifest";

// 1. Calculate the base props ONE time at the root level
const defaultVideoProps = prepareVideoProps(dummyManifest);

const calculateMetadata: CalculateMetadataFunction<MyCompositionProps> = async ({
  props,
}) => {
  const rounds = props.rounds.map((round) => round.dialogueAudio);
  const announderAudio = props.common.announcerAudio;

  const durations = await audioDuration(announderAudio, rounds);

  const statFrame = 180;

  const audioInFrame = Math.ceil(durations.totalDuration * 30);

  const durationInFrames = audioInFrame + statFrame;

  return {
    durationInFrames,
    props: {
      ...props,
      audioDuration: durations,
    },
  };
};

registerRoot(() => {
  return (
    <>
      <Composition
        id="AnimeRoom"
        component={MyComposition}
        defaultProps={defaultVideoProps}
        durationInFrames={2160}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
});
