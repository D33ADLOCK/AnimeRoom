import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type SkillItem = {
  name: string;
  desc: string;
  letter: string;
  color: string;
};

type SkillsProp = {
  skills: SkillItem[];
};

export default function Skills({ skills }: SkillsProp) {
  return (
    <div className="relative flex h-auto w-full items-center justify-center p-6">
      {/* Tactical Angled Container - Dark Theme */}
      <div
        className="relative w-full overflow-hidden bg-slate-950/80 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl"
        style={{
          clipPath:
            "polygon(0 8%, 4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%)",
          border: "2px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <SkillsLayout skills={skills} />
      </div>
    </div>
  );
}

function SkillIcon({ letter, color }: { letter: string; color: string }) {
  return (
    <div
      className="flex h-20 w-20 rotate-3 items-center justify-center rounded-xl border-4 shadow-lg"
      style={{
        borderColor: color,
        backgroundColor: `${color}33`,
        boxShadow: `0 0 25px ${color}88`,
      }}
    >
      <span
        className="text-5xl font-black text-white italic"
        style={{
          textShadow:
            "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function SkillBlock({
  name,
  desc,
  letter,
  color,
  index,
}: {
  name: string;
  desc: string;
  letter: string;
  color: string;
  index: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * 15;

  const progress = spring({
    fps,
    frame: frame - delay,
    config: {
      mass: 0.8,
      damping: 12,
      stiffness: 40,
    },
  });

  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity = progress;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
      className="flex w-1/2 flex-col gap-4 rounded-2xl border-2 border-white/10 bg-black/40 p-5"
    >
      <div className="flex items-center gap-6">
        <SkillIcon letter={letter} color={color} />
        <div className="flex flex-col">
          <span
            className="text-4xl font-black tracking-tighter uppercase italic"
            style={{
              color,
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
            }}
          >
            {name}
          </span>
          <div className="mt-1 h-[3px] w-full bg-gradient-to-r from-white/60 to-transparent" />
        </div>
      </div>
      <p className="text-2xl leading-relaxed font-bold text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {desc}
      </p>
    </div>
  );
}

function SkillsLayout({ skills }: SkillsProp) {
  return (
    <div className="relative z-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-center gap-4">
        <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-white/40 to-white/10" />
        <h2
          className="text-5xl font-black tracking-[0.25em] text-white uppercase italic"
          style={{
            textShadow:
              "-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 0 20px rgba(255,255,255,0.4)",
          }}
        >
          Skills
        </h2>
        <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-white/40 to-white/10" />
      </div>

      {/* Main Skills Grid */}
      <div className="flex w-full gap-6">
        {skills.map((skill, index) => (
          <SkillBlock
            key={index}
            index={index}
            letter={skill.letter}
            name={skill.name}
            color={skill.color}
            desc={skill.desc}
          />
        ))}
      </div>
    </div>
  );
}
