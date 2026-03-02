import path from "path";
import { genAudio } from "./chatterbox";
import { saveBufferToR2 } from "../storage/saveBufferToR2";

type AudioRound = {
  name: string;
  attacker: "character1" | "character2";
  dialogue: string;
  damage: number;
};

type AudioResult = {
  index: number;
  text: string;
  fileName: string;
  publicUrl: string;
  name: string;
  damage: number;
  attacker: "character1" | "character2";
};

export const generateAudiosWithRetry = async (
  rounds: AudioRound[],
  referenceUrl: string,
  jobId: string,
) => {
  type PendingTask = AudioRound & { index: number };

  let pending: PendingTask[] = rounds.map((r, i) => ({
    ...r,
    index: i,
  }));
  const finalAudios = new Array<AudioResult | null>(rounds.length).fill(null);

  const MAX_ATTEMPT = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPT; attempt++) {
    if (pending.length === 0) break;

    if (attempt > 0) {
      console.log(
        `🔄 Retry attempt ${attempt}/${MAX_ATTEMPT - 1} for ${pending.length} failed audio(s)...`,
      );
    }

    const results = await Promise.allSettled(
      pending.map((r) =>
        generateAndSaveAudio(r.index, r.name, referenceUrl, r.dialogue, jobId),
      ),
    );

    const stillFailed: PendingTask[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      const task = pending[i]!;

      if (r.status === "fulfilled") {
        finalAudios[task.index] = {
          ...r.value,
          name: task.name,
          damage: task.damage,
          attacker: task.attacker,
        };
      } else {
        console.error(
          `❌ Failed: ${task.name}-${task.index} (attempt ${attempt + 1})`,
          r.reason,
        );
        stillFailed.push(task);
      }
    }
    pending = stillFailed;
  }

  return finalAudios;
};

export const generateAndSaveAudio = async (
  index: number,
  name: string,
  referenceUrl: string,
  text: string,
  jobId: string,
) => {
  const audioOutput = await genAudio(text, referenceUrl);

  const fileName = `${name}-${index}.wav`;
  const r2Key = path.posix.join(jobId, "audio", fileName);

  const publicUrl = await saveBufferToR2(audioOutput.audioBuffer, r2Key);

  console.log(`  ✅ Audio saved: ${fileName}`);
  return { index, text, fileName, publicUrl };
};
