import path from "path";
import { genAudio } from "./chatterbox";
import { saveBufferToR2 } from "../storage/saveBufferToR2";

export const generateAndSaveAudio = async (
  index: number,
  name: string,
  referenceUrl: string,
  text: string,
  jobId: string,
) => {
  const audioOutput = await genAudio(text, referenceUrl);

  const fileName = `${name}-${index}.mp3`;
  const r2Key = path.posix.join(jobId, "audio", fileName);

  const publicUrl = await saveBufferToR2(audioOutput.audioBuffer, r2Key);

  return { index, text, fileName, publicUrl };
};
