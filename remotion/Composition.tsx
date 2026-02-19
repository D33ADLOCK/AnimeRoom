import { AbsoluteFill, Sequence, staticFile } from "remotion";
import Introduction from "./scenes/Introduction";
import CharacterStats from "./scenes/CharacterStats";
import BattleRound from "./scenes/BattleRound";

export const MyComposition = () => {
  // Images
  const bgImage = staticFile("images/background.png");
  const gogetaSingle = staticFile("images/gogeta-front-trimmed.png");
  const vegitoSingle = staticFile("images/vegito-front-trimmed.png");
  const gogetaSide = staticFile("images/gogeta-side-trimmed.png");
  const vegitoSide = staticFile("images/vegito-side-trimmed.png");
  const vegitoProfile = staticFile("images/vegito-profile.png");
  const gogetaProfile = staticFile("images/gogeta-profile.png");
  const announcerIntro = staticFile("images/announcer-image.png");

  // Audios
  const announcerAudio = staticFile(
    "audio/announcer/dbz-announcer/dbz-announcer-opening-4.mp3",
  );

  // Battle Audios
  const vegitoD1 = staticFile("audio/Vegito-d1.mp3");
  const vegitoD2 = staticFile("audio/Vegito-d2.mp3");
  const vegitoD3 = staticFile("audio/Vegito-d3.mp3");
  const gogetaD1 = staticFile("audio/gogeta-d1.mp3");
  const gogetaD2 = staticFile("audio/gogeta-d2.mp3");
  const gogetaD3 = staticFile("audio/gogeta-d3.mp3");

  // Skills data
  const gogetaSkills = [
    {
      name: "Ego Shield",
      color: "#F472B6",
      desc: "Blocks facts. Takes double damage from receipts.",
      letter: "E",
    },
    {
      name: "Flex Projection",
      color: "#A78BFA",
      desc: "Shows achievements that never happened.",
      letter: "F",
    },
  ];

  const vegitoSkills = [
    {
      name: "Ratio Beam",
      color: "#38BDF8",
      desc: "Instantly deletes any comment with zero likes.",
      letter: "R",
    },
    {
      name: "Cope Driver",
      color: "#FBBF24",
      desc: "Forces the opponent to explain why they lost for 10 minutes.",
      letter: "C",
    },
  ];

  // Timeline constants
  const INTRO_END = 180;
  const STATS_DURATION = 90;
  const BATTLE_DURATION = 300;
  const CHIP_FRAME = 210;

  const statsEnd = INTRO_END + STATS_DURATION * 2; // 360

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontSize: 100,
        backgroundColor: "white",
      }}
    >
      {/* ─── Introduction / Announcer ─── */}
      <Sequence durationInFrames={INTRO_END}>
        <Introduction
          audio={announcerAudio}
          background={bgImage}
          characterImage={announcerIntro}
        />
      </Sequence>

      {/* ─── Gogeta Stats (image left) ─── */}
      <Sequence from={INTRO_END} durationInFrames={STATS_DURATION}>
        <CharacterStats
          background={bgImage}
          characterImage={gogetaSide}
          side="left"
          title="TikToker Gogeta"
          caption="This is the test caption"
          skills={gogetaSkills}
        />
      </Sequence>

      {/* ─── Vegito Stats (image right) ─── */}
      <Sequence
        from={INTRO_END + STATS_DURATION}
        durationInFrames={STATS_DURATION}
      >
        <CharacterStats
          background={bgImage}
          characterImage={vegitoSide}
          side="right"
          title="The L Taker Vegito"
          caption="THis is just sample"
          skills={vegitoSkills}
        />
      </Sequence>

      {/* ─── Round 1: Vegito roasts → Gogeta takes damage ─── */}
      <Sequence from={statsEnd} durationInFrames={BATTLE_DURATION}>
        <BattleRound
          background={bgImage}
          characterImage={vegitoSingle}
          profileImage={gogetaProfile}
          audio={vegitoD1}
          name="Gogeta Blue"
          chipfrom={100}
          percentage={83}
          chipStartFrame={CHIP_FRAME}
          side="left"
        />
      </Sequence>

      {/* ─── Round 2: Gogeta roasts → Vegito takes damage ─── */}
      <Sequence
        from={statsEnd + BATTLE_DURATION}
        durationInFrames={BATTLE_DURATION}
      >
        <BattleRound
          background={bgImage}
          characterImage={gogetaSingle}
          profileImage={vegitoProfile}
          audio={gogetaD1}
          name="Vegito Blue"
          chipfrom={100}
          percentage={76}
          chipStartFrame={CHIP_FRAME}
          side="right"
        />
      </Sequence>

      {/* ─── Round 3: Vegito roasts → Gogeta takes damage ─── */}
      <Sequence
        from={statsEnd + BATTLE_DURATION * 2}
        durationInFrames={BATTLE_DURATION}
      >
        <BattleRound
          background={bgImage}
          characterImage={vegitoSingle}
          profileImage={gogetaProfile}
          audio={vegitoD2}
          name="Gogeta Blue"
          chipfrom={83}
          percentage={61}
          chipStartFrame={CHIP_FRAME}
          side="left"
        />
      </Sequence>

      {/* ─── Round 4: Gogeta roasts → Vegito takes damage ─── */}
      <Sequence
        from={statsEnd + BATTLE_DURATION * 3}
        durationInFrames={BATTLE_DURATION}
      >
        <BattleRound
          background={bgImage}
          characterImage={gogetaSingle}
          profileImage={vegitoProfile}
          audio={gogetaD2}
          name="Vegito Blue"
          chipfrom={76}
          percentage={52}
          chipStartFrame={CHIP_FRAME}
          side="right"
        />
      </Sequence>

      {/* ─── Round 5: Vegito roasts → Gogeta takes damage ─── */}
      <Sequence
        from={statsEnd + BATTLE_DURATION * 4}
        durationInFrames={BATTLE_DURATION}
      >
        <BattleRound
          background={bgImage}
          characterImage={vegitoSingle}
          profileImage={gogetaProfile}
          audio={vegitoD3}
          name="Gogeta Blue"
          chipfrom={61}
          percentage={38}
          chipStartFrame={CHIP_FRAME}
          side="left"
        />
      </Sequence>

      {/* ─── Round 6: Gogeta roasts → Vegito takes damage ─── */}
      <Sequence
        from={statsEnd + BATTLE_DURATION * 5}
        durationInFrames={BATTLE_DURATION}
      >
        <BattleRound
          background={bgImage}
          characterImage={gogetaSingle}
          profileImage={vegitoProfile}
          audio={gogetaD3}
          name="Vegito Blue"
          chipfrom={52}
          percentage={28}
          chipStartFrame={CHIP_FRAME}
          side="right"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
