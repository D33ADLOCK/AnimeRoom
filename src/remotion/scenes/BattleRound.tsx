import { Audio, spring, useCurrentFrame, useVideoConfig } from "remotion";
import Background from "../components/Background";
import Caption from "../components/Caption";
import EgoHudBar from "../components/EgoBar";
import CharacterImage from "../components/CharacterImage";
import BattleSkillIcon from "../components/BattleSkillIcon";

export default function BattleRound({
  background,
  characterImage,
  profileImage,
  audio,
  name = "Character",
  chipfrom = 100,
  percentage = 83,
  chipStartFrame = 90,
  side = "left",
  // caption = "Again this is just sample",
  skillIcons,
}: {
  background: string;
  characterImage: string;
  profileImage: string;
  audio: string;
  name?: string;
  chipfrom?: number;
  percentage?: number;
  chipStartFrame?: number;
  side?: "left" | "right";
  // caption?: string;
  skillIcons: string[];
}) {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 30,
      mass: 5,
      stiffness: 60,
    },
  });

  const characterEl = (
    <div
      className={`flex flex-[2] items-center justify-center ${
        side === "right" ? "max-h-[900px] w-auto pt-40" : ""
      }`}
    >
      <CharacterImage
        image={characterImage}
        className="h-[1020px] w-auto object-contain"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center bottom",
        }}
      />
    </div>
  );

  const skillsEl = (
    <div className="mt-80 flex flex-1 flex-col items-center">
      <BattleSkillIcon skillIcons={skillIcons} />
    </div>
  );

  return (
    <div className="relative h-full w-full">
      <Background background={background} width={width} height={height} />
      <Audio src={audio} />

      {/* <Caption caption={caption} /> */}

      <div className="absolute top-[20%] left-0 flex h-[70%] w-full flex-col gap-4">
        <EgoHudBar
          name={name}
          chipStartFrame={chipStartFrame}
          chipfrom={chipfrom}
          percentage={percentage}
          characterImage={profileImage}
        />

        <div className="flex h-[960px] w-full flex-1 items-center px-8">
          {side === "left" ? (
            <>
              {characterEl}
              {skillsEl}
            </>
          ) : (
            <>
              {skillsEl}
              {characterEl}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
