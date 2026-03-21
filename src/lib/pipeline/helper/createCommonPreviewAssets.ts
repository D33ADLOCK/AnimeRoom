import type { LivePreviewStateSchema } from "../../realtime/job-event";

const R2_BASE = process.env.R2_PUBLIC_BASE_URL!;

const ANNOUNCER_AUDIO_POOL = [
  `${R2_BASE}/common/audio/announcer/announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-4.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-1.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-4.mp3`,
] as const;

const pickRandom = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]!;

export const createCommonPreviewAssets =
  (): LivePreviewStateSchema["common"] => ({
    backgroundImageUrl: `${R2_BASE}/common/images/background.png`,
    announcerImageUrl: `${R2_BASE}/common/images/announcer-image.png`,
    announcerAudioUrl: pickRandom(ANNOUNCER_AUDIO_POOL),
    skillIcons: [
      `${R2_BASE}/common/images/skill1.png`,
      `${R2_BASE}/common/images/skill2.png`,
      `${R2_BASE}/common/images/skill3.png`,
    ],
  });
