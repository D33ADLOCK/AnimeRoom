import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { type ManifestType } from "./dummyManifest";

type CharacterImageType = {
  angle: string;
  fileName: string;
  publicUrl: string;
}[];

export const prepareVideoProps = (manifest: ManifestType) => {
  const { images, audio, common, script } = manifest;

  const getImage = (charImage: CharacterImageType, angle: string) => {
    return charImage.find((image) => angle === image.angle)?.publicUrl;
  };

  const getAudioDuration = async (src: string) => {
    const input = new Input({
      formats: ALL_FORMATS,
      source: new UrlSource(src, {
        getRetryDelay: () => null,
      }),
    });

    try {
      return await input.computeDuration();
    } finally {
      input.dispose();
    }
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
      ? audio.char1Dialogues[char1AudioIndex++].publicUrl
      : audio.char2Dialogues[char2AudioIndex++].publicUrl;

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

  const audioDuration = async () => {
    const announcerMeta = await getAudioDuration(common.announcerAudio);

    const roundsMeta = await Promise.all(
      rounds.map((round) => getAudioDuration(round.dialogueAudio)),
    );

    const allMeta = [announcerMeta, ...roundsMeta];
    let totalDuration = 0;
    allMeta.forEach((dur) => (totalDuration += dur));

    return { announcerMeta, roundsMeta, totalDuration };
  };

  return {
    character,
    common,
    rounds,
    audioDuration,
  };
};
