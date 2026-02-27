"use client";

import React, { useState } from "react";
import { StatsCard } from "./statsCard";
import type { PrepareVideoPropsType } from "~/lib/video/prepareVideoProps";
import { RoundCard } from "./roundCard";
import ImageEditorModal from "./imageEditorModal";
import RoundEditorModal from "./roundEditorModal";
import { api } from "~/trpc/react";
import { VOICE_IDS } from "~/lib/constant";
import { toast } from "sonner";

// Only one modal open at a time
type ActiveModal = "image" | "round" | null;

export function VideoAssetsEditor({
  videoProps,
  jobId,
}: {
  videoProps: PrepareVideoPropsType;
  jobId: string;
}) {
  // State for Video Prop
  const [videoProp, setVideoProp] = useState(videoProps);

  // Shared modal state — only one modal at a time
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Image editor state
  const [selectedCharacter, setSelectedCharacter] = useState<
    "character1" | "character2"
  >("character1");
  const [selectedAngle, setSelectedAngle] = useState<
    "front" | "side" | "profile"
  >("front");

  // Round editor state
  const [selectedRound, setSelectedRound] = useState<number>(0);

  // TRPC Mutations
  const { mutateAsync: regenAudio } = api.job.regenerateAudio.useMutation();
  const { mutateAsync: regenImage } = api.job.regenerateImage.useMutation();
  const { mutateAsync: saveToDb } = api.job.saveVideoPropToDb.useMutation();

  // Helper: save videoProp to DB (fire-and-forget, don't block UI)
  const persistToDb = (updatedProp: PrepareVideoPropsType) => {
    saveToDb({ jobId, videoProp: updatedProp }).catch((err) => {
      console.error("Failed to save to DB:", err);
      toast.error("Failed to save changes to database");
    });
  };

  // Open image editor
  const handleOpenImageModal = (
    character: "character1" | "character2",
    angle: "front" | "side" | "profile",
  ) => {
    setSelectedCharacter(character);
    setSelectedAngle(angle);
    setActiveModal("image");
  };

  // Open round editor
  const handleOpenRoundModal = (roundIndex: number) => {
    setSelectedRound(roundIndex);
    setActiveModal("round");
  };

  const handleImageRegen = async (prompt: string) => {
    const name = videoProp.character[selectedCharacter].details.name;

    const image = await regenImage({
      jobId,
      prompt,
      name,
      angle: selectedAngle,
    });

    const newImage = `${image.imageUrl}?v=${Date.now()}`;

    const newProp = { ...videoProp };

    const imageProp =
      newProp.character[selectedCharacter].angles[selectedAngle];

    imageProp.image = newImage;
    imageProp.prompt = prompt;

    setVideoProp(newProp);
    persistToDb(newProp);
    toast.success("Image regenerated & saved");

    return image;
  };

  const handleRegenAudio = async (text: string) => {
    const rounds = videoProp.rounds[selectedRound];

    if (!rounds) return;

    const audio = await regenAudio({
      dialogue: text,
      index: selectedRound,
      name: rounds.attackerName,
      jobId,
      voiceId: VOICE_IDS[rounds.attackingCharacter],
    });

    const newUrl = `${audio.publicUrl}?v=${Date.now()}`;

    const newProp = { ...videoProp };
    const newRounds = { ...newProp.rounds };
    const newRound = newRounds[selectedRound]!;

    newRound.dialogueText = text;
    newRound.dialogueAudio = newUrl;

    newProp.rounds[selectedRound] = newRound;

    setVideoProp(newProp);
    persistToDb(newProp);
    toast.success("Audio regenerated & saved");

    return audio;
  };

  // Dynamic title from character names
  const char1Name = videoProp.character.character1.details.name;
  const char2Name = videoProp.character.character2.details.name;

  return (
    <>
      {/* Image Editor Modal */}
      <ImageEditorModal
        open={activeModal === "image"}
        characters={videoProp.character}
        onOpenChange={(open) => setActiveModal(open ? "image" : null)}
        selectedCharacter={selectedCharacter}
        selectedAngle={selectedAngle}
        setSelectedCharacter={setSelectedCharacter}
        setSelectedAngle={setSelectedAngle}
        setVideoProp={setVideoProp}
        onImageRegen={handleImageRegen}
      />

      {/* Round Editor Modal */}
      <RoundEditorModal
        open={activeModal === "round"}
        onOpenChange={(open) => setActiveModal(open ? "round" : null)}
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
        rounds={videoProp.rounds}
        onRegenAudio={handleRegenAudio}
      />

      {/* Editor Area */}
      <div className="flex w-2/3 flex-col gap-4">
        {/* Title */}
        <div className="flex text-2xl font-bold">
          {char1Name} v/s {char2Name} Roast Battle
        </div>

        {/* Character Stats */}
        <div className="flex w-full items-start gap-8">
          {/* Character 1 */}
          <StatsCard
            characterId="character1"
            character={videoProp.character.character1}
            onOpenModal={handleOpenImageModal}
          />

          {/* Character 2 */}
          <StatsCard
            characterId="character2"
            character={videoProp.character.character2}
            onOpenModal={handleOpenImageModal}
          />
        </div>

        {/* Rounds */}
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Rounds</h2>
          {videoProp.rounds.map((round, index) => {
            return (
              <RoundCard
                key={index}
                characterName={round.attackerName}
                dialogue={round.dialogueText}
                damage={round.damage}
                imageUrl={round.attackerImage}
                onClick={() => handleOpenRoundModal(index)}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
