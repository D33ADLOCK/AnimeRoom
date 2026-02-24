import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_IMAGE_API_TOKEN,
});

export const genImage = async (
  prompt: string,
  url: string,
): Promise<ReadableStream<Uint8Array>> => {
  const input = {
    size: "1K",
    prompt,
    aspect_ratio: "9:16",
    image_input: [url],
    max_images: 1,
  };

  const output = await replicate.run("google/nano-banana", { input });

  return output as unknown as ReadableStream<Uint8Array>;
};
