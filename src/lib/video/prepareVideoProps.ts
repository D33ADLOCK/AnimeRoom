import { parseMedia } from "@remotion/media-parser";
import { type ManifestType } from "~/lib/ai/pipeline";

type CharacterImageType = {
  angle: string;
  fileName: string;
  publicUrl: string;
  failed: boolean;
}[];

// Calculate All Audio Clips
export const allAudioDuration = async (
  announcerAudio: string,
  rounds: string[],
) => {
  const announcerMeta = await getAudioDuration(announcerAudio);

  const roundsMeta = await Promise.all(
    rounds.map((round) => getAudioDuration(round)),
  );

  const allMeta = [announcerMeta, ...roundsMeta];
  let totalDuration = 0;
  allMeta.forEach((dur) => (totalDuration += dur));

  return { announcerMeta, roundsMeta, totalDuration };
};

export type AudioDurationType = typeof allAudioDuration;

export const prepareVideoProps = async (manifest: ManifestType) => {
  const { images, audio, common, script } = manifest;

  const getImage = (charImage: CharacterImageType, angle: string): string => {
    const image = charImage.find((entry) => angle === entry.angle);
    if (!image?.publicUrl) {
      throw new Error(`Missing image URL for angle: ${angle}`);
    }
    return image.publicUrl;
  };

  const getImagePrompt = (
    imagePrompt: ManifestType["script"]["imagePrompts"][
      | "character1"
      | "character2"],
    angle: string,
  ): string => {
    const image = imagePrompt.find((entry) => angle === entry.angle);
    if (!image?.prompt) {
      throw new Error(`Missing image URL for angle: ${angle}`);
    }
    return image.prompt;
  };

  const getImageFailed = (
    charImage: CharacterImageType,
    angle: string,
  ): boolean => {
    const image = charImage.find((entry) => angle === entry.angle);
    return image?.failed ?? false;
  };

  const getDialogueUrl = (roundIndex: number): string => {
    const audioEntry = audio[roundIndex];
    if (!audioEntry?.publicUrl) {
      throw new Error(`Missing dialogue URL for round index ${roundIndex}`);
    }
    return audioEntry.publicUrl;
  };

  const character = {
    character1: {
      details: script.character1,
      angles: {
        front: {
          image: getImage(images.char1Images, "front"),
          prompt: getImagePrompt(script.imagePrompts.character1, "front"),
          failed: getImageFailed(images.char1Images, "front"),
        },
        side: {
          image: getImage(images.char1Images, "side"),
          prompt: getImagePrompt(script.imagePrompts.character1, "side"),
          failed: getImageFailed(images.char1Images, "side"),
        },
        profile: {
          image: getImage(images.char1Images, "profile"),
          prompt: getImagePrompt(script.imagePrompts.character1, "profile"),
          failed: getImageFailed(images.char1Images, "profile"),
        },
      },
    },
    character2: {
      details: script.character2,
      angles: {
        front: {
          image: getImage(images.char2Images, "front"),
          prompt: getImagePrompt(script.imagePrompts.character2, "front"),
          failed: getImageFailed(images.char2Images, "front"),
        },
        side: {
          image: getImage(images.char2Images, "side"),
          prompt: getImagePrompt(script.imagePrompts.character2, "side"),
          failed: getImageFailed(images.char2Images, "side"),
        },
        profile: {
          image: getImage(images.char2Images, "profile"),
          prompt: getImagePrompt(script.imagePrompts.character2, "profile"),
          failed: getImageFailed(images.char2Images, "profile"),
        },
      },
    },
  };

  let char1Health = 100;
  let char2Health = 100;

  const rounds = script.rounds.map((round, roundIndex) => {
    const isChar1Attacking = round.attacker === "character1";

    const attackerName = isChar1Attacking
      ? script.character1.name
      : script.character2.name;

    const attackerImage = isChar1Attacking
      ? getImage(images.char1Images, "front")
      : getImage(images.char2Images, "front");

    const dialogueAudio = getDialogueUrl(roundIndex);

    const dialogueText = round.dialogue;

    const damage = round.damage;

    // Health logic: The OPPONENT takes the damage
    let startingHealth = 100;
    let endingHealth = 100;

    if (isChar1Attacking) {
      // Character 2 is taking damage
      startingHealth = char2Health;
      endingHealth = Math.max(0, char2Health - damage);
      char2Health = endingHealth;
    } else {
      // Character 1 is taking damage
      startingHealth = char1Health;
      endingHealth = Math.max(0, char1Health - damage);
      char1Health = endingHealth;
    }

    const opponentName = isChar1Attacking
      ? script.character2.name
      : script.character1.name;

    const opponentProfile = isChar1Attacking
      ? getImage(images.char2Images, "profile")
      : getImage(images.char1Images, "profile");

    return {
      attackingCharacter: round.attacker,
      attackerName,
      attackerImage,
      dialogueAudio,
      dialogueText,
      damage,
      opponentName,
      opponentProfile,
      startingHealth,
      endingHealth,
    };
  });

  const getAudioMeta = async () => {
    const announcerAudio = common.announcerAudio;
    const roundsAudio = rounds.map((round) => round.dialogueAudio);

    return await allAudioDuration(announcerAudio, roundsAudio);
  };

  const audioDuration = await getAudioMeta();

  return {
    character,
    common,
    rounds,
    audioDuration,
  };
};

export type PrepareVideoPropsType = Awaited<
  ReturnType<typeof prepareVideoProps>
>;

// Uses Remotion's official media-parser to extract audio duration
const getAudioDuration = async (src: string): Promise<number> => {
  const result = await parseMedia({
    src,
    fields: {
      durationInSeconds: true,
    },
  });

  return result.durationInSeconds ?? 0;
};
