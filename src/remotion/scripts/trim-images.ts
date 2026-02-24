import { alphaTrim } from "../lib/utils/sharp";
import path from "path";

const imagesDir = path.resolve(process.cwd(), "public/website");

const imagesToTrim = [
  { name: "logo-nobg-2.png", output: "logo-trimmed-2.png" },
  // { name: "skill2.png", output: "skill2-trimmed.png" },
  // { name: "skill3.png", output: "skill3-trimmed.png" },

  //   { name: "vegito-front-no-bg.png", output: "vegito-front-trimmed.png" },
];

async function main() {
  console.log("Starting image trim...");

  for (const img of imagesToTrim) {
    const inputPath = path.join(imagesDir, img.name);
    const outputPath = path.join(imagesDir, img.output);

    console.log(`Trimming ${img.name} -> ${img.output}`);
    try {
      await alphaTrim(inputPath, outputPath);
      console.log(`Successfully trimmed ${img.name}`);
    } catch (error) {
      console.error(`Error trimming ${img.name}:`, error);
    }
  }

  console.log("Image trim complete!");
}

main();
