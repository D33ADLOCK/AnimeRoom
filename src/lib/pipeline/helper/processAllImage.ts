import { genImageFast } from "../../ai/imageReplicate";

export const processAllImages = async (
  allImageTask: {
    character: "character1" | "character2";
    angle: "front" | "side" | "profile";
    prompt: string;
  }[],
) => {
  const imageOutput = await Promise.all(
    allImageTask.map(async (i) => {
      const output = await genImageFast(i.prompt);

      return {
        angle: i.angle,
        character: i.character,
        prompt: i.prompt,
        output,
      };
    }),
  );

  return imageOutput;
};
