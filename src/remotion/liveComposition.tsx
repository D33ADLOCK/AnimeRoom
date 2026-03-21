import { AbsoluteFill, Series } from "remotion";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import Introduction from "./scenes/Introduction";
import CharacterStats from "./scenes/CharacterStats";
import BattleRound from "./scenes/BattleRound";

export default function LiveComposition({ props }: { props: LiveStateType }) {
  const { announcer, characterStats, rounds, common } = props.data;

  // Calculate health dynamically from accumulated damage
  const readyRounds = rounds.filter((round) => round.ready);
  let char1Health = 100;
  let char2Health = 100;

  const roundHealthData = readyRounds.map((round) => {
    // The attacker deals damage to the opponent
    if (round.attackingCharacter === "character1") {
      const startingHealth = char2Health;
      char2Health = Math.max(0, char2Health - round.damage);
      return { chipfrom: startingHealth, percentage: char2Health };
    } else {
      const startingHealth = char1Health;
      char1Health = Math.max(0, char1Health - round.damage);
      return { chipfrom: startingHealth, percentage: char1Health };
    }
  });

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
        {readyRounds.map((round, index) => (
          <Series.Sequence
            key={`round-${round.roundIndex}`}
            durationInFrames={round.durationFrames}
          >
            <BattleRound
              background={common.backgroundImageUrl}
              characterImage={round.attackerImage!}
              profileImage={round.opponentProfile!}
              audio={round.dialogueAudio!}
              name={
                round.attackingCharacter === "character2"
                  ? characterStats.character1.name
                  : characterStats.character2.name
              }
              chipfrom={roundHealthData[index]!.chipfrom}
              percentage={roundHealthData[index]!.percentage}
              chipStartFrame={round.durationFrames - 30}
              side={
                round.attackingCharacter === "character1" ? "right" : "left"
              }
              skillIcons={common.skillIcons}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
}
