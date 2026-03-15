import { z } from "zod";

const StatLoose = z.object({
  label: z.string().describe("Label for the skill"),
  value: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "the stat for the chracter and it must be relevant to the character.",
    ),
  color: z.string().describe("Hex color like #FF3D00"),
});

const SkillLoose = z.object({
  name: z.string(),
  color: z.string().describe("Hex color like #38BDF8"),
  desc: z.string().describe("short description for the skill"),
});

const CharacterLoose = z.object({
  name: z.string().describe("Character Name"),
  title: z
    .string()
    .describe(
      "funny title for the character, keep it short of around only 2-3 words and must be relevant to the chracter",
    ),
  stats: z
    .array(StatLoose)
    .describe(
      "Exactly 5 items, think before you give the stats it should be relevant",
    ),
  skills: z.array(SkillLoose).describe("Exactly 2 items"),
});

const imagePrompts = z.object({
  character1: z
    .array(
      z.object({
        angle: z.enum(["front", "side", "profile"]),
        prompt: z.string().describe("Detailed image generation prompt"),
      }),
    )
    .length(3)
    .describe(
      "3 shots: front (facing camera), side (slight RIGHT 3/4 view), profile (right side view)",
    ),
  character2: z
    .array(
      z.object({
        angle: z.enum(["front", "side", "profile"]),
        prompt: z.string().describe("Detailed image generation prompt"),
      }),
    )
    .length(3)
    .describe(
      "3 shots: front (facing camera), side (slight LEFT 3/4 view), profile (left side view)",
    ),
});

export const RoastBattleSchema = z.object({
  character1: CharacterLoose,
  character2: CharacterLoose,
  imagePrompts,
  thumbnailPrompt: z
    .string()
    .describe(
      "A image prompt for the video thumbnail depicting BOTH characters together in a dramatic face-off pose.",
    ),
  rounds: z.array(
    z.object({
      attacker: z.enum(["character1", "character2"]),
      dialogue: z
        .string()
        .describe(
          "The dialogue must be short but really savage and relevant to the opponent",
        ),
      damage: z
        .number()
        .int()
        .min(1)
        .max(100)
        .describe(
          "This is the damage that the opponent taking from the roast. The more savage and funny the dialogue the more damage. But One character HP never decrease below 100 by the end of all rounds.",
        ),
    }),
  ),
});

export type RoastBattleSchemaType = z.infer<typeof RoastBattleSchema>;
