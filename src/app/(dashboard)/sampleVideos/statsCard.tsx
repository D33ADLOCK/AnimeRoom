"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import ImageEditorModal from "./imageEditorModal";

function AssetBox({
  imgSrc,
  imgAlt,
  isModalOpen,
  handleModelClick,
}: {
  imgSrc: string;
  imgAlt: "front" | "side" | "profile";
  isModalOpen: boolean;
  handleModelClick: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {/* 9:16 Image Container */}
      <div
        onClick={handleModelClick}
        className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-gray-100 shadow-[2px_2px_0px_var(--color-nb-shadow)] transition-transform hover:-translate-y-1"
      >
        {isModalOpen && (
          <ImageEditorModal
            initialCharacter={"character1"}
            initialedAngle={imgAlt}
          />
        )}

        <Image src={imgSrc} alt={imgAlt} fill className="object-cover" />
      </div>
      {/* Label underneath */}
      <span className="truncate text-center text-xs font-bold uppercase">
        {imgAlt}
      </span>
    </div>
  );
}

type StatsCardProp = {
  isModalOpen: boolean;
  handleModelClick: () => void;
};

export function StatsCard({ isModalOpen, handleModelClick }: StatsCardProp) {
  console.log("isModalOpen: ", isModalOpen);
  const [isOpen, setIsOpen] = useState(false);
  const profileImagePath =
    "https://pub-a84c9577f3e14dc795b6c4efb1ecb53b.r2.dev/6b4b6d37-9e58-492e-bc9a-491cf6b2f3c1/images/Sukuna-profile.png";

  return (
    <div className="flex h-min w-1/2 flex-col border-[3px] border-[var(--color-nb-border)] bg-white shadow-[6px_6px_0px_var(--color-nb-shadow)] transition-all">
      {/* ALWAYS VISIBLE HEADER */}
      <div className="flex cursor-pointer items-center gap-4 bg-[var(--color-nb-bg)] p-4 transition-colors hover:bg-[var(--color-nb-yellow)] hover:shadow-[inset_0px_-3px_0px_rgba(0,0,0,0.1)]">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border-[3px] border-[var(--color-nb-border)] bg-white">
          <Image
            src={profileImagePath}
            className="object-cover"
            alt="profileImage"
            fill
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            Sukuna
          </h1>
          <p className="text-sm font-semibold">King of Curses</p>
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
                imgSrc={profileImagePath}
                imgAlt="front"
                isModelOpen={isModalOpen}
                handleModelClick={handleModelClick}
              />
              <AssetBox
                imgSrc={profileImagePath}
                isModelOpen={isModalOpen}
                imgAlt="side"
                handleModelClick={handleModelClick}
              />
              <AssetBox
                imgSrc={profileImagePath}
                isModelOpen={isModalOpen}
                imgAlt="profile"
                handleModelClick={handleModelClick}
              />
            </div>
          </div>

          {/* Stats/Attributes Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold tracking-wider uppercase">
              Attributes
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                style={{ backgroundColor: "#FF0000", color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  Ego Overload
                </span>
                <span className="font-extrabold">98</span>
              </div>
              <div
                className="flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                style={{ backgroundColor: "#FF4500", color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  Roast Immunity
                </span>
                <span className="font-extrabold">85</span>
              </div>
              <div
                className="flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                style={{ backgroundColor: "#DC143C", color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  Trash Talk Fury
                </span>
                <span className="font-extrabold">92</span>
              </div>
              <div
                className="flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                style={{ backgroundColor: "#8B0000", color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  Intimidation Flex
                </span>
                <span className="font-extrabold">95</span>
              </div>
              <div
                className="col-span-2 flex items-center justify-between border-[3px] border-[var(--color-nb-border)] px-3 py-2 shadow-[2px_2px_0px_var(--color-nb-shadow)]"
                style={{ backgroundColor: "#B22222", color: "white" }}
              >
                <span className="truncate pr-2 text-xs font-bold uppercase">
                  Villain Swag
                </span>
                <span className="font-extrabold">88</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
