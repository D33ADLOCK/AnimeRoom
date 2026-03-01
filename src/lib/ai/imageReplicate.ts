import Replicate, { type FileOutput } from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_IMAGE_API_TOKEN,
});

export const genImage = async (prompt: string, url: string) => {
  const input = {
    size: "1K",
    prompt,
    aspect_ratio: "9:16",
    image_input: [url],
    max_images: 1,
  };

  const output = await replicate.run("google/nano-banana", { input });

  // Replicate returns FileOutput (ReadableStream + .url() + .blob())
  // but .run() is typed as Promise<object>, so we cast it
  const file = (Array.isArray(output) ? output[0] : output) as FileOutput;

  return { file, url: file.url() };
};
