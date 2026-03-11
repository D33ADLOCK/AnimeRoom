"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";

type RoundEditorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRound: number;
  setSelectedRound: (round: number) => void;
  rounds: PrepareVideoPropsType["rounds"];
  onRegenAudio: (text: string) => Promise<{
    index: number;
    text: string;
    fileName: string;
    publicUrl: string;
  }>;
};

export default function RoundEditorModal({
  open,
  onOpenChange,
  selectedRound,
  setSelectedRound,
  rounds,
  onRegenAudio,
}: RoundEditorModalProps) {
  // Audio States
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevRoundRef = useRef(selectedRound);

  const currentRound = rounds[selectedRound];

  // Dialogue State
  const [dialogue, setDialogue] = useState(currentRound?.dialogueText ?? "");

  useEffect(() => {
    setDialogue(() => currentRound?.dialogueText ?? "");
  }, [currentRound?.dialogueText]);

  if (!currentRound) return null;

  // Reset audio when switching rounds
  if (prevRoundRef.current !== selectedRound) {
    prevRoundRef.current = selectedRound;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAudio = () => {
    const el = audioRef.current;
    if (!el) return;

    setIsPlaying((prev) => {
      const next = !prev;
      if (next) el.play().catch((e) => console.log(e));
      else el.pause();
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 border-[3px] border-[var(--color-nb-border)] bg-white p-0 shadow-[8px_8px_0px_var(--color-nb-shadow)] sm:rounded-none">
        {/* Header */}
        <DialogHeader className="border-b-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-yellow)] px-6 py-4">
          <DialogTitle className="text-xl font-extrabold tracking-wider uppercase">
            Round Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 pt-4 pb-6">
          {/* ── Round Tabs — full-width ── */}
          <div className="flex border-[3px] border-[var(--color-nb-border)]">
            {rounds.map((round, i) => (
              <button
                key={i}
                onClick={() => setSelectedRound(i)}
                className={`flex-1 cursor-pointer py-3 text-center transition-all ${
                  i < rounds.length - 1
                    ? "border-r-[3px] border-[var(--color-nb-border)]"
                    : ""
                } ${
                  selectedRound === i
                    ? "bg-[var(--color-nb-yellow)]"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <span className="block text-xs font-extrabold tracking-wider uppercase">
                  R{i + 1}
                </span>
                <span className="block text-[10px] font-bold text-gray-500">
                  {round.attackerName}
                </span>
              </button>
            ))}
          </div>

          {/* ── Character Name ── */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold tracking-tight uppercase">
              {currentRound.attackerName}
            </h2>
            <div className="flex items-center gap-1.5 border-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-pink)] px-2 py-0.5 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
              <span className="text-[10px] font-extrabold uppercase">DMG</span>
              <span className="text-sm font-black">{currentRound.damage}</span>
            </div>
          </div>

          {/* ── Image + Dialogue Side by Side ── */}
          <div className="flex gap-6">
            {/* Left — 9:16 Image */}
            <div className="relative aspect-[9/16] w-44 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100 shadow-[4px_4px_0px_var(--color-nb-shadow)]">
              <Image
                src={currentRound.attackerImage}
                alt={currentRound.attackerName}
                fill
                className="object-cover"
              />
            </div>

            {/* Right — Dialogue (editable) */}
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-wider uppercase">
                  Dialogue
                </h3>
                <span
                  className={`text-xs font-bold ${
                    dialogue.length >= 300
                      ? "text-red-500"
                      : dialogue.length >= 220
                        ? "text-orange-500"
                        : "text-gray-400"
                  }`}
                >
                  {dialogue.length}/300
                </span>
              </div>

              {/* Editable Textarea */}
              <textarea
                className="flex-1 resize-none border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-bg)] p-4 text-sm leading-relaxed font-semibold text-gray-700 shadow-[2px_2px_0px_var(--color-nb-shadow)] outline-none focus:border-[var(--color-nb-yellow)]"
                value={dialogue}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setDialogue(e.target.value);
                  }
                }}
                rows={5}
                key={currentRound.dialogueText}
              />
            </div>
          </div>

          {/* ── Audio Section — USER will implement useRef playback here ── */}

          <audio
            src={currentRound.dialogueAudio}
            ref={audioRef}
            onLoadedMetadata={() => {
              const el = audioRef.current;
              if (el && Number.isFinite(el.duration)) setDuration(el.duration);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setProgress(100);
            }}
            onTimeUpdate={() => {
              const el = audioRef.current;
              if (!el || !Number.isFinite(el.duration) || el.duration <= 0)
                return;
              setProgress(Math.ceil((el.currentTime / el.duration) * 100));
            }}
          />
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold tracking-wider uppercase">
              Audio
            </h3>
            <div className="flex items-center gap-4 border-[3px] border-[var(--color-nb-border)] bg-gray-50 p-4 shadow-[2px_2px_0px_var(--color-nb-shadow)]">
              {/* Play button placeholder — USER will add useRef + onClick logic */}
              <button
                onClick={handleAudio}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-[3px] border-[var(--color-nb-border)] bg-[var(--color-nb-mint)] shadow-[2px_2px_0px_var(--color-nb-shadow)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--color-nb-shadow)]"
              >
                {isPlaying ? <Pause /> : <Play />}
              </button>

              {/* Progress bar placeholder — USER will make this dynamic */}
              <div className="flex-1">
                <div className="h-3 w-full border-[2px] border-[var(--color-nb-border)] bg-white">
                  <div
                    className={`h-full bg-[var(--color-nb-yellow)]`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <span className="min-w-[70px] text-right text-xs font-bold text-gray-500">
                {formatTime(audioRef.current?.currentTime ?? 0)} /{" "}
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* ── Regenerate Audio Button ── */}
          <button
            type="submit"
            disabled={isRegenerating}
            onClick={async () => {
              setIsRegenerating(true);
              try {
                await onRegenAudio(dialogue);
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
            {isRegenerating ? "⏳ Generating..." : "🔄 Regenerate Audio"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
