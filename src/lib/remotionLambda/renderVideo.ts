import {
  renderMediaOnLambda,
  getRenderProgress,
} from "@remotion/lambda/client";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";

export async function startVideoRender({
  finalJobState,
  jobId,
}: {
  finalJobState: LiveStateType;
  jobId: string;
}) {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: "us-east-1",
    functionName: process.env.REMOTION_FUNCTION_NAME!,
    serveUrl: process.env.REMOTION_SERVE_URL!,
    composition: "AnimeRoom",
    inputProps: finalJobState,
    codec: "h264",
    outName: `${jobId}.mp4`,
  });

  return { renderId, bucketName };
}

export async function getVideoRenderProgress({
  renderId,
  bucketName,
}: {
  renderId: string;
  bucketName: string;
}) {
  return await getRenderProgress({
    renderId,
    bucketName,
    functionName: process.env.REMOTION_FUNCTION_NAME!,
    region: "us-east-1",
  });
}
