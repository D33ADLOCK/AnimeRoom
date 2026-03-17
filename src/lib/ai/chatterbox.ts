import Replicate, { type FileOutput } from "replicate";

const ELEVENLABS_FLASH = "elevenlabs/flash-v2.5";

const replicate = new Replicate({
  auth: process.env.REPLICATE_IMAGE_API_TOKEN,
});

export async function genAudio(text: string, referenceUrl: string) {
  const input = {
    seed: 0,
    text,
    cfg_weight: 0.5,
    language: "en",
    temperature: 0.8,
    reference_audio: referenceUrl,
    exaggeration: 0.5,
  };

  const output = await replicate.run(ELEVENLABS_FLASH, { input });

  const file = (Array.isArray(output) ? output[0] : output) as FileOutput;

  const url = file.url();

  const blob = await file.blob();
  const audioBuffer = Buffer.from(await blob.arrayBuffer());

  return { audioBuffer, url };
}
