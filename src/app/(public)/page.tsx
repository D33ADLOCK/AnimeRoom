import { dummyManifest } from "~/remotion/dummyManifest";
import { prepareVideoProps } from "~/lib/video/prepareVideoProps";
import { PreviewPlayer } from "../_components/previewPlayer";

export default async function Home() {
  const STATS_DURATOION = 90; // Per round

  const defaultVideoProps = await prepareVideoProps(dummyManifest);

  const totalDurationInFrames = Math.ceil(
    Math.ceil(defaultVideoProps.audioDuration.totalDuration * 30) +
      STATS_DURATOION * 2,
  );

  return (
    <div>
      <PreviewPlayer
        playerProps={defaultVideoProps}
        totalDuration={totalDurationInFrames}
      />
    </div>
  );
}
