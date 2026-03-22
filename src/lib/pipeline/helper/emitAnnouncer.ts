import { getAudioDuration } from "../../audio/getAudioDuration";
import { createCommonPreviewAssets } from "./createCommonPreviewAssets";
import type { LiveStateType } from "./createEmptyPreviewState";
import { stateUpdateAndEmit } from "./stateUpdateAndEmit";

export const emitAnnouncer = async ({
  liveState,
}: {
  liveState: LiveStateType;
}) => {
  const commonAssets = createCommonPreviewAssets();
  const announcerDurationInFrames = Math.ceil(
    (await getAudioDuration(commonAssets.announcerAudioUrl)) * 30,
  );
  await stateUpdateAndEmit(liveState, (state) => {
    state.data.common = commonAssets;
    state.data.announcer.durationFrames = announcerDurationInFrames;
    state.data.announcer.ready = true;
  });
};
