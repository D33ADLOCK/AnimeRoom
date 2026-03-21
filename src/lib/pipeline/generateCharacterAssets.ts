import { genImageFast } from "../ai/imageReplicate";

export const generateCharacterAssets = async (prompt: string) => {
  const characterSideImage = await genImageFast(prompt);

  if (!characterSideImage) throw new Error("Image gen failed");

  const url = characterSideImage.url.toString();

  return {
    prompt: prompt,
    imageUrl: url,
  };
};
