import Replicate, { type FileObject, type FileOutput } from "replicate";

const BG_MODEL =
  "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

const replicate = new Replicate({
  auth: process.env.REPLICATE_IMAGE_API_TOKEN,
});

export const removeBg = async (imageUrl: URL) => {
  const output = await replicate.run(BG_MODEL, {
    input: {
      image: imageUrl,
    },
  });

  const file = (Array.isArray(output) ? output[0] : output) as FileOutput;

  const url = file.url();

  const blob = await file.blob();
  const imageBuffer = Buffer.from(await blob.arrayBuffer());

  return { imageBuffer, url };
};
