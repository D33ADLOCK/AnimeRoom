import { randomUUID } from "crypto";
import { generateStructuredOutput } from "./grok";
import { generateCharacterDialogues } from "./audio";
import { generateCharacterImages } from "./images";

// ─── Config ─────────────────────────────────────────────────────────────────

const VOICE_IDS = {
  character1: "yoZ06aMxZJJ28mfd3POQ",
  character2: "VR6AewLTigWG4xSOukaG",
};

// ─── Script Generation ───────────────────────────────────────────────────────

const userPrompt =
  "Generate a roast battle between Goku and Naruto, make it super savage";

const script = await generateStructuredOutput(userPrompt);
if (!script) throw new Error("Failed to generate script from Grok");

const jobId = randomUUID();
console.log(`\n🎬 Starting pipeline for job: ${jobId}\n`);

// ─── Character Setup ─────────────────────────────────────────────────────────

const char1Rounds = script.rounds.filter((r) => r.attacker === "character1");
const char2Rounds = script.rounds.filter((r) => r.attacker === "character2");

// ─── Orchestration ───────────────────────────────────────────────────────────

const generateAllDialogues = async () => {
  console.log("🎙  Generating all dialogues...");
  const [char1Dialogues, char2Dialogues] = await Promise.all([
    generateCharacterDialogues(
      script.character1.name,
      char1Rounds,
      VOICE_IDS.character1,
      jobId,
    ),
    generateCharacterDialogues(
      script.character2.name,
      char2Rounds,
      VOICE_IDS.character2,
      jobId,
    ),
  ]);
  console.log("✅ All dialogues saved.\n");
  return { char1Dialogues, char2Dialogues };
};

const generateAllImages = async () => {
  console.log("🖼  Generating all images...");
  // Sequential per character to respect Replicate's rate limits
  const char1Images = await generateCharacterImages(
    script.character1.name,
    script.imagePrompts.character1,
    jobId,
  );
  const char2Images = await generateCharacterImages(
    script.character2.name,
    script.imagePrompts.character2,
    jobId,
  );
  console.log("✅ All images saved.\n");
  return { char1Images, char2Images };
};

// ─── Main Entry Point ────────────────────────────────────────────────────────

const runPipeline = async () => {
  const [dialogues, images] = await Promise.all([
    generateAllDialogues(),
    generateAllImages(),
  ]);

  const manifest = {
    jobId,
    script,
    audio: dialogues,
    images,
  };

  console.log("\n🎉 Pipeline complete!");
  console.log(`📁 Assets saved to: r2/${jobId}/`);

  return manifest;
};

const manifest = await runPipeline();
console.log("\n📋 Manifest:", JSON.stringify(manifest, null, 2));
