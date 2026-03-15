import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

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
  return audio;
};
