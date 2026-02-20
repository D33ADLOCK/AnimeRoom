import { AbsoluteFill, Sequence } from "remotion";
import Introduction from "./scenes/Introduction";
import CharacterStats from "./scenes/CharacterStats";
import BattleRound from "./scenes/BattleRound";
import { dummyManifest } from "./dummyManifest";
import { prepareVideoProps } from "./prepareVideoProps";
import { useCallback } from "react";
// TODO: These will come from the manifest props once the full pipeline is wired up.
// For now, using hardcoded R2 URLs as placeholders.

const newVideoProp = prepareVideoProps(dummyManifest);

export const MyComposition = () => {
  // ── Common assets (will come from manifest.common) ──
  const bgImage = newVideoProp.common.background;
  const announcerIntro = newVideoProp.common.announcerImage;
  const announcerAudio = newVideoProp.common.announcerAudio;

  // ── Per-battle character images — local public/ (will come from
  const firstCharacterside = newVideoProp.character.character1.images.side;
  const secondCharacterside = newVideoProp.character.character2.images.side;

  // Skills data
  const firstCharacterSkills = newVideoProp.character.character1.details.skills;
  const secondCharacterSkills =
    newVideoProp.character.character2.details.skills;

  // Data references to keep JSX clean
  const char1 = newVideoProp.character.character1.details;
  const char2 = newVideoProp.character.character2.details;
  const rounds = newVideoProp.rounds;

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

      {/* ─── Character 1 Stats (image left) ─── */}
      <Sequence from={INTRO_END} durationInFrames={STATS_DURATION}>
        <CharacterStats
          background={bgImage}
          characterImage={firstCharacterside}
          side="left"
          title={char1.title}
          caption={char1.name}
          skills={firstCharacterSkills}
        />
      </Sequence>

      {/* ─── Character 2 Stats (image right) ─── */}
      <Sequence
        from={INTRO_END + STATS_DURATION}
        durationInFrames={STATS_DURATION}
      >
        <CharacterStats
          background={bgImage}
          characterImage={secondCharacterside}
          side="right"
          title={char2.title}
          caption={char2.name}
          skills={secondCharacterSkills}
        />
      </Sequence>

      {/* ─── Dynamic Battle Rounds ─── */}
      {rounds.map((round, index) => {
        // Calculate the start time for this specific round based on its index
        const sequenceStart = statsEnd + BATTLE_DURATION * index;

        return (
          <Sequence
            key={`round-${index}`}
            from={sequenceStart}
            durationInFrames={BATTLE_DURATION}
          >
            <BattleRound
              background={bgImage}
              characterImage={round.attackerImage}
              profileImage={round.opponentProfile}
              audio={round.dialogueAudio}
              name={round.opponentName}
              chipfrom={round.startingHealth}
              percentage={round.endingHealth}
              chipStartFrame={CHIP_FRAME}
              side={round.attackerName === char1.name ? "right" : "left"} // Attacker is on the opposite side
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
