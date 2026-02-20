import { generateText, Output } from "ai";
import { xai } from "@ai-sdk/xai";
import { RoastBattleSchema } from "../schemas/roast-battle";
import "dotenv/config";

const Userprompt = (userprompt: string) => {
  return `
Generate a roast-battle JSON object based on the scenario below.

SCENARIO:
${userprompt}

HARD REQUIREMENTS:
- Output MUST be a single valid JSON object (no markdown, no code fences, no extra text).
- Output MUST match the schema exactly (same keys, correct nesting, no extra keys).
- Exactly 2 characters: character1 and character2.
- Each character MUST have: name, title, stats (5), skills (2).

STATS RULES (exactly 5 per character):
- Use funny, meme-ish stat labels (e.g. "Delusional", "MC Syndrome", "Trash Talk Accuracy", "Ego-to-Skill Ratio", "Foot-in-Mouth Rate").
- Values: integers 0–100. Colors: hex strings like "#FF3D00".

SKILLS RULES (exactly 2 per character):
- Each skill: name, letter (1–2 chars), color (#RRGGBB), desc (short and funny).

ROUNDS RULES (exactly 6 rounds):
- Each round: attacker ("character1" or "character2"), dialogue, damage (1–100).
- Dialogue must be short (1 sentence), savage, PG-13. Personal attacks allowed, no slurs/hate.
- Make the back-and-forth feel like a real roast battle.

IMAGE PROMPTS (exactly 3 per character, inside "imagePrompts"):
- A reference image is provided ONLY for art style. Your prompts must tell the image model to match that style.
- DEFAULT STYLE: Unless the user's scenario explicitly requests a specific form/style, ALWAYS describe characters in their **chibi / cute / child form** (adorable expressions).
- Each prompt must include: character name, "chibi form" (unless user says otherwise), pose, expression, and "strictly match the art style of the reference image".
- 3 angles per character:
  * "front" — full-body front-facing chibi hero shot, looking at camera.
  * "side" — 3/4 body chibi shot. character1 faces slight RIGHT, character2 faces slight LEFT.
  * "profile" — close-up chibi headshot. character1 RIGHT profile, character2 LEFT profile.
- Keep prompts concise (1–2 sentences). Do NOT mention background — just the character.
- Example: "Chibi Gogeta in Super Saiyan Blue form, front-facing with tiny fists raised, big sparkly eyes, adorable smirk, strictly match the art style of the reference image"

ONLY RETURN THE JSON OBJECT.
  `.trim();
};

export async function generateScript(userPrompt: string) {
  const { output } = await generateText({
    model: xai("grok-4-1-fast-non-reasoning"),
    output: Output.object({
      schema: RoastBattleSchema,
    }),
    prompt: Userprompt(userPrompt),
  });

  return output;
}
