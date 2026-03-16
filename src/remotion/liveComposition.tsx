import { AbsoluteFill, Series } from "remotion";
import type { LiveStateType } from "~/lib/pipeline/createEmptyPreviewState";
import Introduction from "./scenes/Introduction";
import CharacterStats from "./scenes/CharacterStats";
import BattleRound from "./scenes/BattleRound";

export default function LiveComposition({ props }: { props: LiveStateType }) {
  const { announcer, characterStats, rounds, common } = props.data;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontSize: 100,
        backgroundColor: "white",
      }}
    >
      <Series>
        {/* ─── Introduction / Announcer ─── */}
        {announcer.ready && (
          <Series.Sequence durationInFrames={announcer.durationFrames}>
            <Introduction
              background={common.backgroundImageUrl}
              audio={common.announcerAudioUrl}
              characterImage={common.announcerImageUrl}
            />
          </Series.Sequence>
        )}

        {/* ─── Character 1 Stats ─── */}
        {characterStats.character1.ready && (
          <Series.Sequence
            durationInFrames={characterStats.character1.durationFrames}
          >
            <CharacterStats
              background={common.backgroundImageUrl}
              characterImage={characterStats.character1.imageUrl!}
              side="left"
              title={characterStats.character1.title}
              caption={characterStats.character1.name}
              skills={characterStats.character1.skills}
            />
          </Series.Sequence>
        )}

        {/* ─── Character 2 Stats ─── */}
        {characterStats.character2.ready && (
          <Series.Sequence
            durationInFrames={characterStats.character2.durationFrames}
          >
            <CharacterStats
              background={common.backgroundImageUrl}
              characterImage={characterStats.character2.imageUrl!}
              side="right"
              title={characterStats.character2.title}
              caption={characterStats.character2.name}
              skills={characterStats.character2.skills}
            />
          </Series.Sequence>
        )}

        {/* ─── Battle Rounds ─── */}
        {rounds
          .filter((round) => round.ready)
          .map((round) => (
            <Series.Sequence
              key={`round-${round.roundIndex}`}
              durationInFrames={round.durationFrames}
            >
              <BattleRound
                background={common.backgroundImageUrl}
                characterImage={round.attackerImage!}
                profileImage={round.opponentProfile!}
                audio={round.dialogueAudio!}
                name={round.opponentName}
                chipfrom={round.startingHealth}
                percentage={round.endingHealth}
                chipStartFrame={round.durationFrames - 30}
                side={
                  round.attackingCharacter === "character1" ? "right" : "left"
                }
                caption={round.dialogueText}
                skillIcons={common.skillIcons}
              />
            </Series.Sequence>
          ))}
      </Series>
    </AbsoluteFill>
  );
}
