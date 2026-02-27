import path from "path";
import type { Rounds } from "./types";
import { saveStreamToR2 } from "../storage/upload";
import { createAudioFileFromText } from "./elevenlabs";

export const generateCharacterDialogues = async (
  name: string,
  rounds: Rounds,
  voiceId: string,
  jobId: string,
) => {
  const audioTasks = rounds.map(async (round, index) => {
    const { dialogue: text } = round;
    return await generateAndSaveAudio(index, name, voiceId, text, jobId);
  });

  return Promise.all(audioTasks);
};

export const generateAndSaveAudio = async (
  index: number,
  name: string,
  voiceId: string,
  text: string,
  jobId: string,
) => {
  const audioStream = await createAudioFileFromText(text, voiceId);

  const fileName = `${name}-${index}.mp3`;
  const r2Key = path.posix.join(jobId, "audio", fileName);

  const publicUrl = await saveStreamToR2(audioStream, r2Key);

  console.log(`  ✅ Audio saved: ${fileName}`);
  return { index, text, fileName, publicUrl };
};
