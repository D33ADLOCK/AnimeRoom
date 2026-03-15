import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";
import { VideoAssetsEditor } from "../_components/videoAssetsEditor";
import { PreviewPlayer } from "~/app/_components/previewPlayer";

type VideoPlayerProps = {
  videoProps: PrepareVideoPropsType;
  jobId: string;
};

export const VideoPlayer = ({ videoProps, jobId }: VideoPlayerProps) => {
  const STATS_DURATION = 90; // Per round

  const totalDurationInFrames = Math.ceil(
    Math.ceil(videoProps.audioDuration.totalDuration * 30) + STATS_DURATION * 2,
  );

  return (
    <div className="flex gap-4 px-8">
      {/* Editor Area */}
      <VideoAssetsEditor videoProps={videoProps} jobId={jobId} />

      {/* Preview Player - sticky on the right */}
      <div className="top-4 h-fit w-1/3 shrink">
        <div className="border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[6px_6px_0px_var(--color-nb-shadow)]">
          <PreviewPlayer
            playerProps={videoProps}
            totalDuration={totalDurationInFrames}
          />
        </div>
      </div>
    </div>
  );
};
