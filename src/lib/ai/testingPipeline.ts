import { writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { generateScript } from "./grok";
import { runPipeline } from "./pipeline";

console.log("🚀 Starting testing pipeline...");

const jobId = randomUUID();
const userPrompt = "Generate a roast battle between sukuna and sakura";

console.log(`📝 Generating script for: "${userPrompt}"`);
const script = await generateScript(userPrompt);

console.log(`🎬 Running full pipeline for jobId: ${jobId}`);
const manifest = await runPipeline(script, jobId);

console.log("✅ Pipeline finished. Saving manifest to dummyManifest.ts");

const outputPath = path.join(process.cwd(), "src/lib/ai/dummyManifest.ts");
const fileContent = `export const dummyManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;

writeFileSync(outputPath, fileContent, "utf-8");
console.log(`🎉 Saved manifest to ${outputPath}`);
