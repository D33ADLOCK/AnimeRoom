import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_IMAGE_API_TOKEN,
});

export const genDialogue = async (prompt: string, seed = 0) => {
  const input = {
    seed,
    prompt,
    cfg_weight: 0.5,
    temperature: 0.8,
    exaggeration: 0.8,
  };

  const ttsOutput = await replicate.run("resemble-ai/chatterbox", {
    input,
  });

  return ttsOutput;
};
