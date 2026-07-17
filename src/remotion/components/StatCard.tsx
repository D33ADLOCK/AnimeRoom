import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const stats = [
  { label: "Dilusional", value: 46, color: "#FF3D00" },
  { label: "MC Syndrome", value: 67, color: "#FFD600" },
  { label: "Trash Talk Accuracy", value: 25, color: "#00E5FF" },
  { label: "Ego-to-Skill Ratio", value: 76, color: "#D500F9" },
  { label: "Foot-in-Mouth Rate", value: 67, color: "#D500F9" },
];

export default function StatCard() {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-6">
      {/* Enhanced Glassmorphism Container */}
      <div className="relative w-full overflow-hidden rounded-[40px] border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        {/* Glossy Top Edge Highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]" />

        {/* Decorative Corner Glow */}
        <div className="absolute -top-20 -left-20 h-60 w-60 rounded-full bg-white/5 blur-[100px]" />

        <StatsDetails />
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color = "#FFC85A",
  index = 0,
}: {
  label: string;
  value: number;
  color?: string;
  index?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = 5 * index;

  const progress = spring({
    fps,
    frame: frame - delay,
    config: {
      mass: 0.5,
      damping: 10, // lower = more bounce
      stiffness: 100, // higher = snappier
    },
  });

  const progressBar = progress * value;

  return (
    <div className="group flex w-full flex-col gap-4">
      {/* Label and Percentage */}
      <div className="flex items-end justify-between px-1">
        <span
          className="text-4xl font-black tracking-tighter text-white uppercase italic"
          style={{
            textShadow: `
              -2px -2px 0 #000,  
               2px -2px 0 #000,
              -2px  2px 0 #000,
               2px  2px 0 #000,
               0px  4px 8px rgba(0,0,0,0.5)
            `,
          }}
        >
          {label}
        </span>
        <div className="flex items-center justify-center rounded-full border border-white/20 bg-black/60 px-4 py-1 shadow-lg backdrop-blur-md">
          <span
            className="font-mono text-4xl font-black tracking-tighter italic"
            style={{
              color,
              textShadow: `
                -1px -1px 0 #FFF,  
                 1px -1px 0 #FFF,
                -1px  1px 0 #FFF,
                 1px  1px 0 #FFF,
                 0px  0px 15px ${color}88
              `,
            }}
          >
            {Math.round(progressBar)}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative h-10 w-full overflow-hidden rounded-xl border-2 border-white/10 bg-black/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
        {/* Fill Segment Markers (Subtle vertical lines every 10%) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex justify-between px-0 opacity-20">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-full w-[1px] bg-white/40" />
          ))}
        </div>

        {/* The Fill */}
        <div
          className="relative h-full rounded-l-lg border-r-2 border-white/40"
          style={{
            width: `${progressBar}%`,
            background: `linear-gradient(90deg, ${color} 0%, #FFF 160%)`,
            boxShadow: `0 0 25px ${color}66`,
          }}
        >
          {/* Surface Glint Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/30 opacity-60" />

          {/* Animated Shine Beam (Can be enabled later, or leave as static glint) */}
          <div className="absolute inset-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function StatsDetails() {
  return (
    <div className="flex w-full flex-col gap-10 py-4">
      {stats.map((stat, i) => (
        <StatRow
          key={`${stat.label}-${i}`}
          label={stat.label}
          color={stat.color}
          value={stat.value}
          index={i}
        />
      ))}
    </div>
  );
}
