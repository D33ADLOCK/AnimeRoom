"use client";

import Image from "next/image";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";
import type {
  CharacterStatsCardSchema,
  RoundPreviewSchema,
} from "~/lib/realtime/job-event";

// ─── Character Stats Card ────────────────────────────────────────────────────

function LiveCharacterCard({
  character,
  label,
}: {
  character: CharacterStatsCardSchema;
  label: string;
}) {
  const isReady = character.ready;

  return (
    <div
      className={`flex w-1/2 flex-col border-[3px] border-[var(--color-nb-border)] bg-white shadow-[6px_6px_0px_var(--color-nb-shadow)] transition-all duration-500 ${
        isReady ? "" : "pointer-events-none opacity-50 blur-sm"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 bg-[var(--color-nb-bg)] p-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-200">
          {character.imageUrl ? (
            <Image
              src={character.imageUrl}
              className="object-cover"
              alt={character.name || label}
              fill
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-gray-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            {character.name || label}
          </h1>
          <p className="text-sm font-semibold">
            {character.title || "Loading..."}
          </p>
        </div>
      </div>

      {/* Stats */}
      {character.stats.length > 0 && (
        <div className="flex flex-col gap-2 border-t-[3px] border-[var(--color-nb-border)] p-4">
          <h3 className="text-sm font-extrabold tracking-wider uppercase">
            Attributes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {character.stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)] ${
                  i === character.stats.length - 1 &&
                  character.stats.length % 2 !== 0
                    ? "col-span-2"
                    : ""
                }`}
                style={{ backgroundColor: stat.color, color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  {stat.label}
                </span>
                <span className="font-extrabold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Round Card ──────────────────────────────────────────────────────────────

function LiveRoundCard({
  round,
  index,
}: {
  round: RoundPreviewSchema;
  index: number;
}) {
  const isReady = round.ready;

  return (
    <div
      className={`flex items-start gap-3 border-[3px] border-[var(--color-nb-border)] bg-white p-3 shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all duration-500 ${
        isReady ? "" : "pointer-events-none opacity-50 blur-sm"
      }`}
    >
      {/* Square Avatar */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100">
        {round.attackerImage ? (
          <Image
            src={round.attackerImage}
            alt={`Round ${index + 1}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-gray-300" />
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Name + Damage on same row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-tight uppercase">
            Round {index + 1}
          </h3>
          <div className="flex items-center gap-1.5 border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-2 py-0.5 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
            <span className="text-[10px] font-extrabold uppercase">DMG</span>
            <span className="text-sm font-black">{round.damage || "?"}</span>
          </div>
        </div>

        {/* Dialogue */}
        <div className="border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
          <p className="text-sm leading-snug font-semibold text-gray-700 italic">
            &ldquo;{round.dialogueText || "..."}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Live Editor ────────────────────────────────────────────────────────

export default function LiveEditor({
  liveState,
}: {
  liveState: LiveStateType;
}) {
  const { characterStats, rounds } = liveState.data;

  // Show ready rounds + the very next unready round (blurred preview)
  const visibleRounds: RoundPreviewSchema[] = [];
  for (const round of rounds) {
    visibleRounds.push(round);
    if (!round.ready) break; // stop after the first unready one
  }

  const char1Name = characterStats.character1.name || "Character 1";
  const char2Name = characterStats.character2.name || "Character 2";

  return (
    <div className="flex w-2/3 flex-col gap-4">
      {/* Title */}
      <div className="flex text-2xl font-bold">
        {char1Name} v/s {char2Name} Roast Battle
      </div>

      {/* Character Stats */}
      <div className="flex w-full items-start gap-8">
        <LiveCharacterCard
          character={characterStats.character1}
          label="Character 1"
        />
        <LiveCharacterCard
          character={characterStats.character2}
          label="Character 2"
        />
      </div>

      {/* Rounds */}
      <div className="mt-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Rounds</h2>
        {visibleRounds.map((round, index) => (
          <LiveRoundCard key={round.roundIndex} round={round} index={index} />
        ))}
      </div>
    </div>
  );
}
