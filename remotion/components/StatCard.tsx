import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const stats = [
  { label: "Dilusional", value: 46, color: "#FF3D00" },
  { label: "MC Syndrome", value: 67, color: "#FFD600" },
  { label: "Trash Talk Accuracy", value: 25, color: "#00E5FF" },
  { label: "Ego-to-Skill Ratio", value: 76, color: "#D500F9" },
  { label: "Foot-in-Mouth Rate", value: 67, color: "#D500F9" },
];

export default function StatCard() {
  return (
    <div className="relative h-full w-full flex items-center justify-center p-6">
      {/* Enhanced Glassmorphism Container */}
      <div className="relative w-full overflow-hidden rounded-[40px] border-2 border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        {/* Glossy Top Edge Highlight */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]" />

        {/* Decorative Corner Glow */}
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-[100px]" />

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
    <div className="flex flex-col gap-4 w-full group">
      {/* Label and Percentage */}
      <div className="flex justify-between items-end px-1">
        <span
          className="text-4xl font-black italic text-white tracking-tighter uppercase"
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
        <div className="flex items-center justify-center px-4 py-1 rounded-full bg-black/60 border border-white/20 shadow-lg backdrop-blur-md">
          <span
            className="text-4xl font-black italic font-mono tracking-tighter"
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
      <div className="relative h-10 w-full overflow-hidden rounded-xl bg-black/50 border-2 border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
        {/* Fill Segment Markers (Subtle vertical lines every 10%) */}
        <div className="absolute inset-0 flex justify-between px-0 opacity-20 pointer-events-none z-10">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-white/40" />
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}

function StatsDetails() {
  return (
    <div className="flex flex-col gap-10 w-full py-4">
      {stats.map((stat, i) => (
        <StatRow
          label={stat.label}
          color={stat.color}
          value={stat.value}
          index={i}
        />
      ))}
    </div>
  );
}
