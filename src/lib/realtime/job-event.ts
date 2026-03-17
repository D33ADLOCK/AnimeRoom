import z from "zod";
import { SkillSchema, StatSchema } from "../schemas/roast-battle-split";

export const MetaSchema = z.object({
  battleTitle: z.string(),
  shortSubtitle: z.string(),
  thumbnailUrl: z.string().optional(),
});

const CommonPreviewSchema = z.object({
  backgroundImageUrl: z.string().url(),
  announcerImageUrl: z.string().url(),
  announcerAudioUrl: z.string().url(),
  skillIcons: z.array(z.string().url()),
});

const AnnouncerPreviewSchema = z.object({
  ready: z.boolean(),
  durationFrames: z.number().int().nonnegative(),
});

export const CharacterStatsCardSchema = z.object({
  ready: z.boolean(),
  name: z.string(),
  title: z.string(),
  imageUrl: z.string().url().optional(),
  imagePrompt: z.string(),
  stats: z.array(StatSchema),
  skills: z.array(SkillSchema),
  durationFrames: z.number().int().nonnegative(),
});

export const RoundPreviewSchema = z.object({
  roundIndex: z.number().int().nonnegative(),
  ready: z.boolean(),
  durationFrames: z.number().int().nonnegative(),
  attackingCharacter: z.enum(["character1", "character2"]),
  attackerImage: z.string().url().optional(),
  dialogueAudio: z.string().url().optional(),
  dialogueText: z.string(),
  damage: z.number(),
  opponentProfile: z.string().url().optional(),
});

export const livePreviewStateSchema = z.object({
  // type: z.literal("previewUpdate"),
  version: z.number().int().nonnegative(),
  totalDurationFrames: z.number().int().nonnegative(),

  meta: MetaSchema,
  common: CommonPreviewSchema,

  announcer: AnnouncerPreviewSchema,

  characterStats: z.object({
    character1: CharacterStatsCardSchema,
    character2: CharacterStatsCardSchema,
  }),

  rounds: z.array(RoundPreviewSchema),
});

const previewUpdateEvent = z.object({
  type: z.literal("previewUpdate"),
  data: livePreviewStateSchema,
});

const completedEvent = z.object({
  type: z.literal("completed"),
  jobId: z.string(),
  message: z
    .string()
    .optional()
    .describe("e.g. 'Saved successfully to database'"),
});

const errorEvent = z.object({
  type: z.literal("error"),
  code: z.string().describe("e.g. 'ASSET_PIPELINE_CRASH'"),
  message: z.string().describe("User-friendly error message to display"),
});

export const JobEventSchema = z.discriminatedUnion("type", [
  previewUpdateEvent,
  completedEvent,
  errorEvent,
]);

export type JobEvent = z.infer<typeof JobEventSchema>;
export type PreviewUpdateEvent = z.infer<typeof previewUpdateEvent>;
export type LivePreviewStateSchema = z.infer<typeof livePreviewStateSchema>;
export type CharacterStatsCardSchema = z.infer<typeof CharacterStatsCardSchema>;
export type RoundPreviewSchema = z.infer<typeof RoundPreviewSchema>;
