import { api } from "~/trpc/server";
import { VideoPlayer } from "./videoPlayer";
import LivePlayer from "./livePlayer";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const videoProps = await api.job.getManifest({ jobId });

  const isJobCompleted = videoProps != null;

  return isJobCompleted ? (
    <VideoPlayer jobId={jobId} videoProps={videoProps.videoProps!} />
  ) : (
    <LivePlayer />
  );
}
