import { api } from "~/trpc/server";
import LivePlayer from "./livePlayer";
import { createEmptyPreviewState } from "~/lib/pipeline/createEmptyPreviewState";

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const videoManifest = await api.job.getManifest({ jobId });

  const isCompleted = !!videoManifest;

  const emptyManifest = createEmptyPreviewState();

  const vm = videoManifest ?? emptyManifest;

  return <LivePlayer initialLiveState={vm} isComplete={isCompleted} />;
}
