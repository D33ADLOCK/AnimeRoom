import { interpolate } from "remotion";

export type PulseOptions = {
  frame: number;
  fps: number;
  from: number;
  to: number;
  secondsPerCycle?: number;
  offset?: number; // phase offset in seconds (so multiple pulses don't sync)
};

export function pulse({
  frame,
  fps,
  from,
  to,
  secondsPerCycle = 2.5,
  offset = 0,
}: PulseOptions): number {
  const periodInFrames = Math.round(fps * secondsPerCycle);
  const offsetInFrames = Math.round(fps * offset);

  const wave = Math.sin(
    (2 * Math.PI * (frame + offsetInFrames)) / periodInFrames,
  );

  return interpolate(wave, [-1, 1], [from, to]);
}
