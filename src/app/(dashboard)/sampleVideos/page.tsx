import { dummyManifest } from "~/remotion/dummyManifest";
import { prepareVideoProps } from "~/lib/video/prepareVideoProps";
import { PreviewPlayer } from "~/app/_components/previewPlayer";
import { VideoAssetsEditor } from "./videoAssetsEditor";

export default async function Page() {
  const STATS_DURATION = 90; // Per round

  // 1. Pass the dummy manifest through our transformer
  const videoProps = await prepareVideoProps(dummyManifest);

  // 2. Calculate the total duration
  const totalDurationInFrames = Math.ceil(
    Math.ceil(videoProps.audioDuration.totalDuration * 30) + STATS_DURATION * 2,
  );

  return (
    <div className="flex gap-4 px-8">
      {/* Editor Area */}
      <VideoAssetsEditor videoProps={videoProps} jobId={dummyManifest.jobId} />

      {/* Preview Player - sticky on the right */}
      <div className="top-4 h-fit w-1/2 w-1/3 shrink">
        <div className="border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[6px_6px_0px_var(--color-nb-shadow)]">
          <PreviewPlayer
            playerProps={videoProps}
            totalDuration={totalDurationInFrames}
          />
        </div>
      </div>
    </div>
  );
}
