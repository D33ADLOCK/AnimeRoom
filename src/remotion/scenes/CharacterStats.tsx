import { useCurrentFrame, useVideoConfig } from "remotion";
import Background from "../components/Background";
import CharacterImage from "../components/CharacterImage";
import Skills from "../components/Skills";
import StatCard from "../components/StatCard";
import Title from "../components/Title";
import Caption from "../components/Caption";
import { pulse } from "../lib/animation/idle";

type Skill = {
  name: string;
  color: string;
  desc: string;
  letter: string;
};

export default function CharacterStats({
  background,
  characterImage,
  side = "left",
  title = "Character Name",
  caption = "",
  skills = [],
}: {
  background: string;
  characterImage: string;
  side?: "left" | "right";
  title?: string;
  caption?: string;
  skills?: Skill[];
}) {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scale = pulse({
    fps,
    frame,
    from: 1,
    to: 1.15,
    secondsPerCycle: side === "left" ? 2.2 : 1.8,
    offset: side === "left" ? 0.3 : 0,
  });

  const imageEl = (
    <CharacterImage
      image={characterImage}
      className="h-[800px] w-full overflow-hidden object-contain"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center bottom",
      }}
    />
  );

  const statsEl = <StatCard />;

  return (
    <div className="relative h-full w-full">
      <Background background={background} width={width} height={height} />

      {caption && <Caption caption={caption} />}

      <div className="absolute top-[20%] left-0 flex h-[80%] w-full flex-col gap-8">
        <Title text={title} />

        <div className="grid h-auto w-full grid-cols-2 items-center gap-2">
          {side === "left" ? (
            <>
              {imageEl}
              {statsEl}
            </>
          ) : (
            <>
              {statsEl}
              {imageEl}
            </>
          )}
        </div>

        <Skills skills={skills} />
      </div>
    </div>
  );
}
