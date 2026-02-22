import { parseMedia } from "@remotion/media-parser";
import { type ManifestType } from "./dummyManifest";

type CharacterImageType = {
  angle: string;
  fileName: string;
  publicUrl: string;
}[];

export const prepareVideoProps = (manifest: ManifestType) => {
  const { images, audio, common, script } = manifest;

  const getImage = (charImage: CharacterImageType, angle: string): string => {
    const image = charImage.find((entry) => angle === entry.angle);
    if (!image?.publicUrl) {
      throw new Error(`Missing image URL for angle: ${angle}`);
    }
    return image.publicUrl;
  };

  const getDialogueUrl = (
    dialogues: ManifestType["audio"]["char1Dialogues"],
    index: number,
    attacker: ManifestType["script"]["rounds"][number]["attacker"],
  ): string => {
    const dialogue = dialogues[index];
    if (!dialogue?.publicUrl) {
      throw new Error(
        `Missing dialogue URL for ${attacker} at dialogue index ${index}`,
      );
    }
    return dialogue.publicUrl;
  };

  const character = {
    character1: {
      details: script.character1,
      images: {
        front: getImage(images.char1Images, "front"),
        side: getImage(images.char1Images, "side"),
        profile: getImage(images.char1Images, "profile"),
      },
    },
    character2: {
      details: script.character2,
      images: {
        front: getImage(images.char2Images, "front"),
        side: getImage(images.char2Images, "side"),
        profile: getImage(images.char2Images, "profile"),
      },
    },
  };
  let char1AudioIndex = 0;
  let char2AudioIndex = 0;

  let char1Health = 100;
  let char2Health = 100;

  const rounds = script.rounds.map((round) => {
    const isChar1Attacking = round.attacker === "character1";

    const attackerName = isChar1Attacking
      ? script.character1.name
      : script.character2.name;

    const attackerImage = isChar1Attacking
      ? getImage(images.char1Images, "front")
      : getImage(images.char2Images, "front");

    const dialogueAudio = isChar1Attacking
      ? getDialogueUrl(audio.char1Dialogues, char1AudioIndex++, "character1")
      : getDialogueUrl(audio.char2Dialogues, char2AudioIndex++, "character2");

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

  return {
    character,
    common,
    rounds,
    audioDuration: {
      announcerMeta: 0,
      roundsMeta: rounds.map(() => 0),
      totalDuration: 0,
    },
  };
};

export type PrepareVideoPropsType = ReturnType<typeof prepareVideoProps>;

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

// Calculate All Audio Clips
export const audioDuration = async (
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

export type AudioDurationType = typeof audioDuration;
