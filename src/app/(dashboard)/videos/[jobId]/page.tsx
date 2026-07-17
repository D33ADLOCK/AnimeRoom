import { api } from "~/trpc/server";
import LivePlayer from "./livePlayer";
import { createEmptyPreviewState } from "~/lib/pipeline/helper/createEmptyPreviewState";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const initialStatus = await api.job.getStatus({ jobId });
  const initialManifest =
    initialStatus.jobStatus === "complete"
      ? await api.job.getManifest({ jobId })
      : null;

  return (
    <LivePlayer
      jobId={jobId}
      initialStatus={initialStatus}
      initialLiveState={initialManifest ?? createEmptyPreviewState()}
      initialManifest={initialManifest}
    />
  );
}
