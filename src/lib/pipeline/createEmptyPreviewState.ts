import type { PreviewUpdateEvent } from "../realtime/job-event";
import { createCommonPreviewAssets } from "./createCommonPreviewAssets";

const createEmptyRound = (roundIndex: number) => ({
  roundIndex,
  ready: false,
  durationFrames: 0,
  attackingCharacter: "character1" as const,
  attackerName: "",
  attackerImage: undefined,
  dialogueAudio: undefined,
  dialogueText: "",
  damage: 0,
  opponentName: "",
  opponentProfile: undefined,
  startingHealth: 100,
  endingHealth: 100,
});

export const createEmptyPreviewState = (): PreviewUpdateEvent => ({
  type: "previewUpdate",
  data: {
    version: 1,
    totalDurationFrames: 0,
    meta: {
      battleTitle: "",
      shortSubtitle: "",
      thumbnailUrl: undefined,
    },
    common: createCommonPreviewAssets(),
    announcer: {
      ready: false,
      durationFrames: 0,
    },
    characterStats: {
      character1: {
        ready: false,
        name: "",
        title: "",
        imagePrompt: "",
        imageUrl: undefined,
        stats: [],
        skills: [],
        durationFrames: 0,
      },
      character2: {
        ready: false,
        name: "",
        title: "",
        imageUrl: undefined,
        imagePrompt: "",
        stats: [],
        skills: [],
        durationFrames: 0,
      },
    },
    rounds: Array.from({ length: 6 }, (_, i) => createEmptyRound(i)),
  },
});

export type LiveStateType = ReturnType<typeof createEmptyPreviewState>;
