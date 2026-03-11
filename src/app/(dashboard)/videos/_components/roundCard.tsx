import Image from "next/image";
import React from "react";

interface RoundCardProps {
  characterName: string;
  dialogue: string;
  damage: number;
  imageUrl: string;
  onClick?: () => void;
}

export function RoundCard({
  characterName,
  dialogue,
  damage,
  imageUrl,
  onClick,
}: RoundCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-start gap-3 border-[3px] border-[var(--color-nb-border)] bg-white p-3 shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]"
    >
      {/* Square Avatar */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100">
        <Image
          src={imageUrl}
          alt={characterName}
          fill
          className="object-cover"
        />
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Name + Damage on same row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold tracking-tight uppercase">
            {characterName}
          </h3>
          <div className="flex items-center gap-1.5 border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-2 py-0.5 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
            <span className="text-[10px] font-extrabold uppercase">DMG</span>
            <span className="text-sm font-black">{damage}</span>
          </div>
        </div>

        {/* Dialogue */}
        <div className="border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
          <p className="text-sm leading-snug font-semibold text-gray-700 italic">
            &ldquo;{dialogue}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
