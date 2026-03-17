const R2_BASE = process.env.R2_PUBLIC_BASE_URL!;

export const VOICE_IDS = {
  character1: "yoZ06aMxZJJ28mfd3POQ",
  character2: "VR6AewLTigWG4xSOukaG",
};

export const UPLOAD_URL_EXPIRY = 10 * 60; // 10 min in sec

export const ELEVENLABS_FLASH_VOICE = [
  "Rachel",
  "Drew",
  "Clyde",
  "Paul",
  "Aria",
  "Domi",
  "Dave",
  "Roger",
  "Fin",
  "Sarah",
  "James",
  "Jane",
  "Juniper",
  "Arabella",
  "Hope",
  "Bradford",
  "Reginald",
  "Gaming",
  "Austin",
  "Kuon",
  "Blondie",
  "Priyanka",
  "Alexandra",
  "Monika",
  "Mark",
  "Grimblewood",
] as const;

export type ELEVENLABS_FLASH_VOICE_TYPE =
  (typeof ELEVENLABS_FLASH_VOICE)[number];

export const ALLOWED_SIZE = {
  voice_reference: 10 * 1024 * 1024,
  image_reference: 10 * 1024 * 1024,
};

export const DEFAULT_VOICE_REF = {
  character1: `${process.env.R2_PUBLIC_BASE_URL!}/references/0073220e1dc738a5/7c6fac23-1843-4787-aab8-839f3d407f70.mp3`,
  character2: `${process.env.R2_PUBLIC_BASE_URL!}/references/0073220e1dc738a5/602c57c3-9692-4d6d-accf-26411eb19c97.mp3`,
};

export const ANNOUNCER_AUDIO_POOL = [
  `${R2_BASE}/common/audio/announcer/announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/announcer-opening-4.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-1.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-2.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-3.mp3`,
  `${R2_BASE}/common/audio/announcer/dbz-announcer-opening-4.mp3`,
] as const;
