import { genAudioFast } from "../ai/elevenLabsReplicate";
import { genImageFast } from "../ai/imageReplicate";
import { getAudioDuration } from "../audio/getAudioDuration";
import type { ELEVENLABS_FLASH_VOICE_TYPE } from "../constant";

export const generateRoundAssets = async (
  round: {
    attackerImagePrompt: string;
    opponentImagePrompt: string;
    dialogue: string;
  },
  voiceRef: ELEVENLABS_FLASH_VOICE_TYPE,
) => {
  const [attackerImage, opponentImage, roundAudio] = await Promise.all([
    genImageFast(round.attackerImagePrompt),
    genImageFast(round.opponentImagePrompt),
    genAudioFast(round.dialogue, voiceRef),
  ]);

  if (!attackerImage || !opponentImage) throw new Error("Image failed");

  const attackerImageUrl = attackerImage.url.toString();
  const opponentImageUrl = opponentImage.url.toString();
  const audioUrl = roundAudio.url.toString();

  const audioDurationFrames = Math.ceil(
    (await getAudioDuration(audioUrl)) * 30,
  );

  return {
    attackerImageUrl,
    opponentImageUrl,
    audioUrl,
    audioDurationFrames,
  };
};
