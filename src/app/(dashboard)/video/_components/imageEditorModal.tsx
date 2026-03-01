"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";

type ImageEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCharacter: "character1" | "character2";
  selectedAngle: "front" | "side" | "profile";
  setSelectedCharacter: (char: "character1" | "character2") => void;
  setSelectedAngle: (angle: "front" | "side" | "profile") => void;
  characters: PrepareVideoPropsType["character"];
  setVideoProp: (videoProp: PrepareVideoPropsType) => void;
  onImageRegen: (prompt: string) => Promise<{
    imageUrl: string;
    fileName: string;
  }>;
};

export default function ImageEditorModal({
  open,
  onOpenChange,
  selectedCharacter,
  selectedAngle,
  setSelectedCharacter,
  setSelectedAngle,
  characters,
  onImageRegen,
}: ImageEditorModalProps) {
  const currentChar = characters[selectedCharacter];
  const currentImage = currentChar.angles[selectedAngle].image;
  const currentPrompt = currentChar.angles[selectedAngle].prompt;

  const [imagePrompt, setImagePrompt] = useState(currentPrompt);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    setImagePrompt(currentPrompt);
  }, [currentPrompt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 border-[3px] border-[var(--color-nb-border)] bg-white p-0 shadow-[8px_8px_0px_var(--color-nb-shadow)] sm:rounded-none">
        {/* Header */}
        <DialogHeader className="border-b-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-6 py-4">
          <DialogTitle className="text-xl font-extrabold tracking-wider uppercase">
            Image Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pt-4 pb-6">
          {/* ── Character Tabs — full-width, edge-to-edge ── */}
          <div className="flex border-b-[3px] border-[var(--color-nb-border)]">
            {(["character1", "character2"] as const).map((char, i) => (
              <button
                key={char}
                onClick={() => setSelectedCharacter(char)}
                className={`flex-1 cursor-pointer py-3 text-sm font-extrabold tracking-wider uppercase transition-all ${
                  i === 0
                    ? "border-r-[3px] border-[var(--color-nb-border)]"
                    : ""
                } ${
                  selectedCharacter === char
                    ? "bg-[var(--color-nb-yellow)]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {characters[char].details.name}
              </button>
            ))}
          </div>

          {/* ── Image + Prompt Side by Side ── */}
          <div className="flex gap-6">
            {/* Left — 9:16 Image Preview */}
            <div className="relative aspect-[9/16] w-48 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100 shadow-[4px_4px_0px_var(--color-nb-shadow)]">
              <Image
                src={currentImage}
                alt={`${currentChar.details.name} ${selectedAngle}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Right — Prompt + Regenerate */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Prompt Label + Counter */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-wider uppercase">
                  Image Prompt
                </h3>
                <span
                  className={`text-xs font-bold ${
                    imagePrompt.length >= 500
                      ? "text-red-500"
                      : imagePrompt.length >= 400
                        ? "text-orange-500"
                        : "text-gray-400"
                  }`}
                >
                  {imagePrompt.length}/500
                </span>
              </div>

              {/* Prompt Text */}
              <div className="flex-1 border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] p-4 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
                <textarea
                  className="h-full w-full resize-none bg-transparent text-xs leading-relaxed font-semibold text-gray-700 outline-none"
                  value={imagePrompt}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setImagePrompt(e.target.value);
                    }
                  }}
                />
              </div>

              {/* Regenerate Button */}
              <button
                disabled={isRegenerating}
                onClick={async () => {
                  setIsRegenerating(true);
                  try {
                    await onImageRegen(imagePrompt);
                  } finally {
                    setIsRegenerating(false);
                  }
                }}
                className={`w-full cursor-pointer border-[3px] border-[var(--color-nb-border)] px-6 py-3 font-extrabold tracking-wider text-[var(--color-nb-text)] uppercase shadow-[4px_4px_0px_var(--color-nb-shadow)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--color-nb-shadow)] ${
                  isRegenerating
                    ? "cursor-not-allowed bg-gray-300 opacity-70"
                    : "bg-[var(--color-nb-pink)]"
                }`}
              >
                {isRegenerating ? "⏳ Generating..." : "🔄 Regenerate Image"}
              </button>
            </div>
          </div>

          {/* ── Angle Selector — full-width at bottom ── */}
          <div className="flex gap-3">
            {(["front", "side", "profile"] as const).map((angle) => (
              <button
                key={angle}
                onClick={() => setSelectedAngle(angle)}
                className={`flex-1 cursor-pointer border-[3px] border-[var(--color-nb-border)] py-2.5 text-xs font-extrabold tracking-wider uppercase transition-all ${
                  selectedAngle === angle
                    ? "translate-x-[1px] translate-y-[1px] bg-[var(--color-nb-mint)] shadow-[1px_1px_0px_var(--color-nb-shadow)]"
                    : "bg-white shadow-[3px_3px_0px_var(--color-nb-shadow)] hover:bg-gray-50"
                }`}
              >
                {angle}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
