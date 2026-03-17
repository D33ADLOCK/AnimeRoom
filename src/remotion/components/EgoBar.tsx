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
    <div className="w-full px-12 mt-10">
      {/* ─── Horizontal HUD Row ─── */}
      <div className="flex items-center gap-6">
        {/* ── Portrait ── */}
        <div
          className="relative shrink-0 w-[150px] h-[150px] rounded-2xl overflow-hidden border-[4px] shadow-[0_0_25px_rgba(0,0,0,0.6)]"
          style={{ borderColor: accentColor }}
        >
          <Img
            src={characterImage}
            className="w-full h-full object-cover object-top"
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
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Character Name */}
          <span
            className="text-5xl font-black italic uppercase tracking-wider"
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
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${chipBarPcg}%`,
                  background: "linear-gradient(90deg, #FF3D3D, #FF6B6B)",
                  boxShadow: "0 0 25px rgba(255,60,60,0.5)",
                }}
              />
              {/* Green Fill (in front) */}
              <div
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${egoBarPcg}%`,
                  background: barColor,
                  boxShadow: "0 0 25px rgba(80,255,170,0.5)",
                }}
              />

              {/* Surface Glint (top half shine) */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-0 top-0 h-1/2 w-full bg-gradient-to-b from-white/25 to-transparent" />
              </div>

              {/* Tick Marks */}
              <div className="pointer-events-none absolute inset-0 flex justify-between px-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-[1px] h-full bg-white/15" />
                ))}
              </div>

              {/* Percentage Label */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span
                  className="text-3xl font-black italic font-mono text-white"
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
            className="text-3xl uppercase tracking-[0.35em] text-black pl-1"
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
