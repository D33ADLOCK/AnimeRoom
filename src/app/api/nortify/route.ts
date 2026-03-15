import { realtime } from "~/lib/redis/realtime";

export const GET = async () => {
  await realtime.emit("pipeline-events", {
    type: "previewUpdate",
    data: {
      version: 1,
      totalDurationFrames: 0,
      common: {
        backgroundImageUrl: "https://example.com/bg.png",
        announcerImageUrl: "https://example.com/announcer.png",
        announcerAudioUrl: "https://example.com/audio.mp3",
        skillIcons: [],
      },
      announcer: { ready: false, durationFrames: 0 },
      characterStats: {
        character1: {
          ready: false,
          name: "Char 1",
          title: "C1",
          stats: [],
          skills: [],
          durationFrames: 0,
        },
        character2: {
          ready: false,
          name: "Char 2",
          title: "C2",
          stats: [],
          skills: [],
          durationFrames: 0,
        },
      },
      rounds: [],
    },
  });

  return new Response("OK");
};
