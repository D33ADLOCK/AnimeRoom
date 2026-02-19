import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

export default function BattleSkillIcon() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const skill1 = staticFile("images/skill1-trimmed.png");
  const skill2 = staticFile("images/skill2-trimmed.png");
  const skill3 = staticFile("images/skill3-trimmed.png");

  const skills = [skill1, skill2, skill3];

  const jitterX = Math.sin(frame * 0.3) * 2 + Math.sin(frame * 0.7);
  const jitterY = Math.cos(frame * 0.4) * 2 + Math.cos(frame * 0.7);

  return (
    <div className="flex flex-col items-center justify-center gap-6 z-10">
      {skills.map((sk, i) => (
        <Img
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
