"use client";

import React, { useState } from "react";
import { StatsCard } from "./statsCard";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";
import { RoundCard } from "./roundCard";

export function VideoAssetsEditor({
  videoProps,
}: {
  videoProps: PrepareVideoPropsType;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModelClick = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      {/* Editor Area */}
      <div className="flex w-2/3 flex-col gap-4">
        {/* Title */}
        <div className="flex text-2xl font-bold">
          Goku v/s Naruto Roast Battle
        </div>

        {/* Character Stats */}
        <div className="flex w-full items-start gap-8">
          {/* Character 1 */}
          <StatsCard isModalOpen={isOpen} handleModelClick={handleModelClick} />

          {/* Character 2 */}
          <StatsCard isModalOpen={isOpen} handleModelClick={handleModelClick} />
        </div>

        {/* Rounds */}
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Rounds</h2>
          {videoProps.rounds.map((round, index) => (
            <RoundCard
              key={index}
              characterName={round.attackerName}
              dialogue={round.dialogueText}
              damage={round.damage}
              imageUrl="https://pub-a84c9577f3e14dc795b6c4efb1ecb53b.r2.dev/6b4b6d37-9e58-492e-bc9a-491cf6b2f3c1/images/Sukuna-profile.png"
            />
          ))}
        </div>
      </div>
    </>
  );
}
