import { Easing, Img, interpolate, useCurrentFrame } from "remotion";

export default function EgoHudBar({
  characterImage,
  name = "Vegito Blue",
  chipfrom = 100,
  percentage,
  barColor = "linear-gradient(90deg, #3CF078, #F5E650)",
  accentColor = "#78D2FF",
  chipStartFrame,
}: {
  characterImage: string;
  name?: string;
  chipfrom: number;
  percentage: number;
  barColor?: string;
  accentColor?: string;
  chipStartFrame: number;
}) {
  const frame = useCurrentFrame();
  const pct = Math.max(0, Math.min(100, chipfrom));
  const easeOutCubic = Easing.out((t) => Easing.cubic(t));

  // pct = frame >= chipStartFrame ? percentage : pct;

  // The angled "casing" shape — only on the outer border, NOT the fill
  const CASING_CLIP =
    "polygon(0% 20%, 4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 80%)";

  const greenDrop = interpolate(
    frame,
    [chipStartFrame, chipStartFrame + 20],
    [pct, percentage],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOutCubic,
    },
  );

  const fillUp = interpolate(frame, [0, 30], [0, pct], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easeOutCubic,
  });

  // Red chip bar — stays at old HP then drains after a delay
  const chipDrain = interpolate(
    frame,
    [chipStartFrame + 15, chipStartFrame + 45],
    [pct, percentage],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOutCubic,
    },
  );

  const egoBarPcg = frame > chipStartFrame ? greenDrop : fillUp;
  const chipBarPcg = frame > chipStartFrame ? chipDrain : fillUp;

  return (
    <div className="mt-10 w-full px-12">
      {/* ─── Horizontal HUD Row ─── */}
      <div className="flex items-center gap-6">
        {/* ── Portrait ── */}
        <div
          className="relative h-[150px] w-[150px] shrink-0 overflow-hidden rounded-2xl border-[4px] shadow-[0_0_25px_rgba(0,0,0,0.6)]"
          style={{ borderColor: accentColor }}
        >
          <Img
            src={characterImage}
            className="h-full w-full object-cover object-top"
          />
          {/* Inner glow ring */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `inset 0 0 0 3px ${accentColor}55, inset 0 0 20px ${accentColor}44`,
            }}
          />
        </div>

        {/* ── Name + Bar Stack ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Character Name */}
          <span
            className="text-5xl font-black tracking-wider uppercase italic"
            style={{
              color: accentColor,
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 15px rgba(0,0,0,0.7)",
            }}
          >
            {name}
          </span>

          {/* ── Angled Casing (outer border only) ── */}
          <div
            className="relative h-[64px] w-full p-[4px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            style={{
              clipPath: CASING_CLIP,
              background: `linear-gradient(90deg, ${accentColor}CC, ${accentColor}66)`,
            }}
          >
            {/* Inner Dark Track */}
            <div
              className="relative h-full w-full overflow-hidden rounded-sm"
              style={{ background: "rgba(0,0,0,0.75)" }}
            >
              {/* Red Chip Bar (behind green) */}
              <div
                className="absolute top-0 left-0 h-full"
                style={{
                  width: `${chipBarPcg}%`,
                  background: "linear-gradient(90deg, #FF3D3D, #FF6B6B)",
                  boxShadow: "0 0 25px rgba(255,60,60,0.5)",
                }}
              />
              {/* Green Fill (in front) */}
              <div
                className="absolute top-0 left-0 h-full"
                style={{
                  width: `${egoBarPcg}%`,
                  background: barColor,
                  boxShadow: "0 0 25px rgba(80,255,170,0.5)",
                }}
              />

              {/* Surface Glint (top half shine) */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-0 h-1/2 w-full bg-gradient-to-b from-white/25 to-transparent" />
              </div>

              {/* Tick Marks */}
              <div className="pointer-events-none absolute inset-0 flex justify-between px-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-full w-[1px] bg-white/15" />
                ))}
              </div>

              {/* Percentage Label */}
              <div className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center gap-1">
                <span
                  className="font-mono text-3xl font-black text-white italic"
                  style={{
                    textShadow:
                      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                  }}
                >
                  {Math.round(egoBarPcg)}%
                </span>
              </div>
            </div>
          </div>

          {/* ── "EGO" label beneath the bar ── */}
          <span
            className="pl-1 text-3xl tracking-[0.35em] text-black uppercase"
            style={{
              textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            }}
          >
            Ego
          </span>
        </div>
      </div>
    </div>
  );
}
