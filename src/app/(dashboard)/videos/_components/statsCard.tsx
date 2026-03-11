"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";

function AssetBox({
  imgSrc,
  imgAlt,
  onClick,
}: {
  imgSrc: string;
  imgAlt: "front" | "side" | "profile";
  onClick: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {/* 9:16 Image Container */}
      <div
        onClick={onClick}
        className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100 shadow-[2px_2px_0px_var(--color-nb-shadow)] transition-transform hover:-translate-y-1"
      >
        <Image src={imgSrc} alt={imgAlt} fill className="object-cover" />
      </div>
      {/* Label underneath */}
      <span className="truncate text-center text-xs font-bold uppercase">
        {imgAlt}
      </span>
    </div>
  );
}

type CharacterId = "character1" | "character2";
type Angle = "front" | "side" | "profile";

type StatsCardProps = {
  characterId: CharacterId;
  onOpenModal: (character: CharacterId, angle: Angle) => void;
  character: PrepareVideoPropsType["character"][CharacterId];
};

export function StatsCard({
  characterId,
  onOpenModal,
  character,
}: StatsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-min w-1/2 flex-col border-[3px] border-[var(--color-nb-border)] bg-white shadow-[6px_6px_0px_var(--color-nb-shadow)] transition-all">
      {/* ALWAYS VISIBLE HEADER */}
      <div className="flex cursor-pointer items-center gap-4 bg-[var(--color-nb-bg)] p-4 transition-colors hover:bg-[var(--color-nb-yellow)] hover:shadow-[inset_0px_-3px_0px_rgba(0,0,0,0.1)]">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-white">
          <Image
            src={character.angles.profile.image}
            className="object-cover"
            alt="profileImage"
            fill
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            {character.details.name}
          </h1>
          <p className="text-sm font-semibold">{character.details.title}</p>
        </div>

        {/* Toggle Icon */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center border-[3px] border-[var(--color-nb-border)] bg-white p-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
        >
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* EXPANDED CONTENT AREA */}
      {isOpen && (
        <div className="flex flex-col gap-6 border-t-[3px] border-[var(--color-nb-border)] p-4">
          {/* Images Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold tracking-wider uppercase">
              Available Assets
            </h3>
            <div className="flex gap-4">
              <AssetBox
                imgSrc={character.angles.front.image}
                imgAlt="front"
                onClick={() => onOpenModal(characterId, "front")}
              />
              <AssetBox
                imgSrc={character.angles.side.image}
                imgAlt="side"
                onClick={() => onOpenModal(characterId, "side")}
              />
              <AssetBox
                imgSrc={character.angles.profile.image}
                imgAlt="profile"
                onClick={() => onOpenModal(characterId, "profile")}
              />
            </div>
          </div>

          {/* Stats/Attributes Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold tracking-wider uppercase">
              Attributes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {character.details.stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)] ${
                    i === character.details.stats.length - 1 &&
                    character.details.stats.length % 2 !== 0
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
        </div>
      )}
    </div>
  );
}
