import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const character1VoiceId = "yoZ06aMxZJJ28mfd3POQ";
const text = "Hello world";

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export const createAudioFileFromText = async (
  text: string,
  voiceID: string,
) => {
  const audio = await elevenlabs.textToSpeech.convert(voiceID, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",

    voiceSettings: {
      stability: 0,
      similarityBoost: 0,
      useSpeakerBoost: true,
      speed: 1.0,
    },
  });

  //   console.log({
  //     hasPipe: typeof (audio as any).pipe === "function",
  //     hasGetReader: typeof (audio as any).getReader === "function",
  //     ctor: (audio as any)?.constructor?.name,
  //   });
  return audio;
};
