import { Img, useCurrentFrame } from "remotion";

export default function BattleSkillIcon({
  skillIcons,
}: {
  skillIcons: string[];
}) {
  const frame = useCurrentFrame();

  const jitterX = Math.sin(frame * 0.3) * 2 + Math.sin(frame * 0.7);
  const jitterY = Math.cos(frame * 0.4) * 2 + Math.cos(frame * 0.7);

  return (
    <div className="z-10 flex flex-col items-center justify-center gap-6">
      {skillIcons.map((sk, i) => (
        <Img
          key={i}
          src={sk}
          style={{
            width: "250px",
            objectFit: "cover",
            transform: `translate(${jitterX}px, ${jitterY}px)`,
          }}
        />
      ))}
    </div>
  );
}
