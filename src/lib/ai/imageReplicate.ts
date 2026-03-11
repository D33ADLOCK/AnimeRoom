import Replicate, { type FileOutput } from "replicate";

const FAST_iMAGE_MODEL = "prunaai/z-image-turbo";

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

export const genImageFast = async (prompt: string) => {
  const input = {
    width: 1080,
    height: 1920,
    prompt,
    output_format: "jpg",
    guidance_scale: 0,
    output_quality: 80,
    num_inference_steps: 8,
  };

  const output = await replicate.run(FAST_iMAGE_MODEL, { input });

  // Replicate returns FileOutput (ReadableStream + .url() + .blob())
  // but .run() is typed as Promise<object>, so we cast it
  const file = (Array.isArray(output) ? output[0] : output) as FileOutput;

  return { file, url: file.url() };
};
