import "server-only";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";

export const getAudioDuration = async (src: string): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src),
  }) as unknown as Input<UrlSource>;

  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};
