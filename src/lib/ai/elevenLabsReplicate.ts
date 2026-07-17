import Replicate, { type FileOutput } from "replicate";
import type { ELEVENLABS_FLASH_VOICE_TYPE } from "../constant";
import { env } from "~/env";

const ELEVENLABS_FLASH = "elevenlabs/flash-v2.5";

const replicate = new Replicate({
  auth: env.REPLICATE_IMAGE_API_TOKEN,
});

export async function genAudioFast(
  text: string,
  voice: ELEVENLABS_FLASH_VOICE_TYPE,
) {
  const input = {
    speed: 1,
    style: 0,
    voice,
    prompt: text,
    next_text: "",
    stability: 0.5,
    language_code: "en",
    previous_text: "",
    similarity_boost: 0.75,
  };

  const output = await replicate.run(ELEVENLABS_FLASH, { input });

  const file = (Array.isArray(output) ? output[0] : output) as FileOutput;

  const url = file.url();

  const blob = await file.blob();
  const audioBuffer = Buffer.from(await blob.arrayBuffer());

  return { audioBuffer, url };
}
