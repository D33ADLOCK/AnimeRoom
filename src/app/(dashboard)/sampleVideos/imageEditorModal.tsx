"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type ImageEditorModalType = {
  initialCharacter: "character1" | "character2";
  initialedAngle: "front" | "side" | "profile";
};

export default function ImageEditorModal({
  initialCharacter,
  initialedAngle,
}: ImageEditorModalType) {
  const [selectedCharacter, setSelectedCharacter] = useState<
    "character1" | "character2"
  >(initialCharacter);
  const [selectedAngle, setSelectedAngle] = useState<
    "front" | "side" | "profile"
  >(initialedAngle);

  // Hardcoded data — you will replace this with real manifest data later
  const characters = {
    character1: { name: "Sukuna" },
    character2: { name: "Sakura" },
  };

  const imageUrl =
    "https://pub-a84c9577f3e14dc795b6c4efb1ecb53b.r2.dev/6b4b6d37-9e58-492e-bc9a-491cf6b2f3c1/images/Sukuna-profile.png";

  const prompt =
    "Chibi Sukuna with four arms and tattoos, full-body front-facing hero shot looking at camera with savage grin and tiny fists up, adorable menacing eyes, strictly match the art style of the reference image";

  return (
    <Dialog>
      {/* TRIGGER — wrap whatever you want to open the dialog */}
      <DialogTrigger asChild>
        <button className="nb-btn cursor-pointer rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-4 py-2 font-extrabold tracking-wider text-[var(--color-nb-text)] uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]">
          Edit Images
        </button>
      </DialogTrigger>

      {/* MODAL CONTENT */}
      <DialogContent className="max-w-4xl border-[3px] border-[var(--color-nb-border)] bg-white p-0 shadow-[8px_8px_0px_var(--color-nb-shadow)] sm:rounded-none">
        {/* Header */}
        <DialogHeader className="border-b-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-6 py-4">
          <DialogTitle className="text-xl font-extrabold tracking-wider uppercase">
            Image Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pt-4 pb-6">
          {/* ── ROW 1: Character Tabs ── */}
          <div className="flex gap-3">
            {(["character1", "character2"] as const).map((char) => (
              <button
                key={char}
                onClick={() => setSelectedCharacter(char)}
                className={`cursor-pointer border-[3px] border-[var(--color-nb-border)] px-5 py-2 text-sm font-extrabold tracking-wider uppercase transition-all ${
                  selectedCharacter === char
                    ? "translate-x-[2px] translate-y-[2px] bg-[var(--color-nb-yellow)] shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                    : "bg-white shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:bg-gray-50"
                }`}
              >
                {characters[char].name}
              </button>
            ))}
          </div>

          {/* ── ROW 2: Angle Selector ── */}
          <div className="flex gap-3">
            {(["front", "side", "profile"] as const).map((angle) => (
              <button
                key={angle}
                onClick={() => setSelectedAngle(angle)}
                className={`cursor-pointer border-[3px] border-[var(--color-nb-border)] px-4 py-1.5 text-xs font-extrabold tracking-wider uppercase transition-all ${
                  selectedAngle === angle
                    ? "translate-x-[1px] translate-y-[1px] bg-[var(--color-nb-mint)] shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                    : "bg-white shadow-[3px_3px_0px_var(--color-nb-shadow)] hover:bg-gray-50"
                }`}
              >
                {angle}
              </button>
            ))}
          </div>

          {/* ── ROW 3: Image + Prompt Side by Side ── */}
          <div className="flex gap-6">
            {/* Left — 9:16 Image Preview */}
            <div className="relative aspect-[9/16] w-48 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100 shadow-[4px_4px_0px_var(--color-nb-shadow)]">
              <Image
                src={imageUrl}
                alt={`${characters[selectedCharacter].name} ${selectedAngle}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Right — Prompt + Regenerate */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Prompt Label */}
              <h3 className="text-sm font-extrabold tracking-wider uppercase">
                Image Prompt
              </h3>

              {/* Prompt Text */}
              <div className="flex-1 border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] p-4 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                <p className="text-sm leading-relaxed font-semibold text-gray-700">
                  {prompt}
                </p>
              </div>

              {/* Regenerate Button */}
              <button className="nb-btn w-full cursor-pointer rounded-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-6 py-3 font-extrabold tracking-wider text-[var(--color-nb-text)] uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                🔄 Regenerate Image
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
