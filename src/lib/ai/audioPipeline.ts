import path from "path";
import type { RoastBattleSchemaType } from "../schemas/roast-battle";
import { saveStreamToR2 } from "../storage/saveToR2";
import { createAudioFileFromText } from "./elevenlabs";

type CharacterData = {
  name: string;
  imagePrompts: RoastBattleSchemaType["imagePrompts"]["character1"];
  rounds: RoastBattleSchemaType["rounds"];
  details: RoastBattleSchemaType["character1"];
};

export const generateCharacterDialogues = async (
  character: CharacterData,
  voiceId: string,
  jobId: `${string}-${string}-${string}-${string}-${string}`,
) => {
  const dialogueLines = character.rounds.map((round) => round.dialogue);

  const audioTasks = dialogueLines.map(async (text, index) => {
    const audioStream = await createAudioFileFromText(text, voiceId);

    const fileName = `${character.name}-${index}.mp3`;

    const r2key = path.posix.join(jobId, "audio", fileName);

    const publicUrl = await saveStreamToR2(audioStream, r2key);
    // const outputPath = path.join(
    //   process.cwd(),
    //   "public",
    //   jobId,
    //   "audio",
    //   fileName,
    // );

    // const savedPath = await saveStreamToFile(audioStream, outputPath);

    // console.log(`  ✅ Audio saved: ${fileName}`);
    return { index, text, fileName, publicUrl };
  });

  return await Promise.all(audioTasks);
};
