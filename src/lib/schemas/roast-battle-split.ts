import { z } from "zod";

// ─── Shared Sub-Schemas ──────────────────────────────────────────────────────

export const StatSchema = z.object({
  label: z.string().describe("Funny stat label relevant to the character"),
  value: z.number().int().min(0).max(100),
  color: z.string().describe("Hex color like #FF3D00"),
});

export const SkillSchema = z.object({
  name: z.string(),
  letter: z.string().describe("Initial letter of the name, 1 char chars"),
  color: z.string().describe("Hex color like #38BDF8"),
  desc: z.string().describe("Short funny description"),
});

// ─── LLM Call 1: Character Bundle (Array of 2) ──────────────────────────────

export const CharacterBundleItemSchema = z.object({
  slot: z
    .enum(["character1", "character2"])
    .describe("Which character slot this belongs to"),
  name: z.string().describe("Character name"),
  title: z
    .string()
    .describe("Short funny title for the character, around 2-4 words"),
  stats: z.array(StatSchema).length(5),
  skills: z.array(SkillSchema).length(2),
  imagePrompt: z
    .string()
    .describe(
      "Detailed image generation prompt for this character's side-angle stats card shot",
    ),
});

export const RoastBattleCharacterSchema = z
  .array(CharacterBundleItemSchema)
  .length(2);

export type RoastBattleCharacterSchemaType = z.infer<
  typeof RoastBattleCharacterSchema
>;

// ─── LLM Call 2: Rounds Bundle (Array of 6) ──────────────────────────────────

export const RoundSchema = z.object({
  attacker: z.enum(["character1", "character2"]),
  attackerName: z.string().describe("Name of the attacking character"),
  opponentName: z.string().describe("Name of the opponent character"),
  dialogue: z.string().describe("One short savage roast dialogue line"),
  damage: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe("Damage dealt by this roast"),
  attackerImagePrompt: z
    .string()
    .describe(
      "Image generation prompt for the attacker's front-facing dynamic pose in this round",
    ),
  opponentImagePrompt: z
    .string()
    .describe(
      "Image generation prompt for the opponent's side profile reaction shot in this round",
    ),
});

export const RoastBattleRoundsSchema = z.array(RoundSchema).length(6);

export type RoastBattleRoundsSchemaType = z.infer<
  typeof RoastBattleRoundsSchema
>;

// ─── LLM Call 3: Metadata (Title, Subtitle, Thumbnail) ──────────────────────

export const RoastBattleMetadataSchema = z.object({
  battleTitle: z
    .string()
    .describe("Short catchy roast battle title for the video"),
  shortSubtitle: z
    .string()
    .describe("One short subtitle or hook line for the video"),
  thumbnailPrompt: z
    .string()
    .describe(
      "Prompt for a thumbnail showing both characters in a dramatic versus pose",
    ),
});

export type RoastBattleMetadataSchemaType = z.infer<
  typeof RoastBattleMetadataSchema
>;
