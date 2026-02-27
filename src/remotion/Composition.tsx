import { AbsoluteFill, Sequence } from "remotion";
import Introduction from "./scenes/Introduction";
import CharacterStats from "./scenes/CharacterStats";
import BattleRound from "./scenes/BattleRound";
import type { PrepareVideoPropsType } from "./prepareVideoProps";
// TODO: These will come from the manifest props once the full pipeline is wired up.
// For now, using hardcoded R2 URLs as placeholders.

export type MyCompositionProps = PrepareVideoPropsType;

export const MyComposition = (props: MyCompositionProps) => {
  // ── Common assets (will come from manifest.common) ──
  const bgImage = props.common.background;
  const announcerIntro = props.common.announcerImage;
  const announcerAudio = props.common.announcerAudio;

  // ── Per-battle character images — local public/ (will come from
  const firstCharacterside = props.character.character1.angles.side.image;
  const secondCharacterside = props.character.character2.angles.side.image;

  // Skills data
  const firstCharacterSkills = props.character.character1.details.skills;
  const secondCharacterSkills = props.character.character2.details.skills;

  // Data references to keep JSX clean
  const char1 = props.character.character1.details;
  const char2 = props.character.character2.details;
  const rounds = props.rounds;

  // Timeline constants
  const INTRO_END = Math.max(
    1,
    Math.ceil(props.audioDuration.announcerMeta * 30),
  );

  const STATS_DURATION = 90;
  const CHIP_FRAME = 210; // TODO: Needs to be dynamic based on when they actually speak

  const statsEnd = INTRO_END + STATS_DURATION * 2;

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
        // Find how many frames THIS specific audio round takes (duration in sec * 30 fps)
        const roundDurationFrames = Math.max(
          1,
          Math.ceil(props.audioDuration.roundsMeta[index] * 30),
        );

        // Calculate the exact start frame by adding up all previous round durations
        let sequenceStart = statsEnd;
        for (let i = 0; i < index; i++) {
          sequenceStart += Math.max(
            1,
            Math.ceil(props.audioDuration.roundsMeta[i] * 30),
          );
        }

        return (
          <Sequence
            key={`round-${index}`}
            from={sequenceStart}
            durationInFrames={roundDurationFrames}
          >
            <BattleRound
              background={bgImage}
              characterImage={round.attackerImage}
              profileImage={round.opponentProfile}
              audio={round.dialogueAudio}
              name={round.opponentName}
              chipfrom={round.startingHealth}
              percentage={round.endingHealth}
              chipStartFrame={roundDurationFrames - 30}
              side={round.attackerName === char1.name ? "right" : "left"}
              skillIcons={props.common.skillIcons}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
