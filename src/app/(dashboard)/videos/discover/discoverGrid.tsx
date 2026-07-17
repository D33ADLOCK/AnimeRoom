"use client";

import Image from "next/image";
import { useState } from "react";
import { Video, Play } from "lucide-react";
import DiscoverOverlay from "./discoverOverlay";

type DiscoverGridType = {
  allVideos: {
    id: string;
    metaData: {
      battleTitle: string;
      shortSubtitle: string;
      thumbnailUrl: string;
    } | null;
    createdAt: Date;
  }[];
};

export default function DiscoverGrid({ allVideos }: DiscoverGridType) {
  const [currentIndex, setCurentIndex] = useState<number | null>(null);

  const handleCurrentIndex = (index: number) => setCurentIndex(index);

  const cardThemes = [
    {
      cardBg: "bg-[var(--color-nb-pink)]",
      tagBg: "bg-[var(--color-nb-yellow)]",
      borderColor: "border-[var(--color-nb-mint)]",
    },
    {
      cardBg: "bg-[var(--color-nb-mint)]",
      tagBg: "bg-[var(--color-nb-pink)]",
      borderColor: "border-[var(--color-nb-lavender)]",
    },
    {
      cardBg: "bg-[var(--color-nb-lavender)]",
      tagBg: "bg-[var(--color-nb-mint)]",
      borderColor: "border-[var(--color-nb-blue)]",
    },
    {
      cardBg: "bg-[var(--color-nb-blue)]",
      tagBg: "bg-[var(--color-nb-orange)]",
      borderColor: "border-[var(--color-nb-pink)]",
    },
    {
      cardBg: "bg-[var(--color-nb-orange)]",
      tagBg: "bg-[var(--color-nb-lavender)]",
      borderColor: "border-[var(--color-nb-yellow)]",
    },
    {
      cardBg: "bg-[var(--color-nb-yellow)]",
      tagBg: "bg-[var(--color-nb-blue)]",
      borderColor: "border-[var(--color-nb-orange)]",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4 xl:gap-10">
        {allVideos.map((v, index) => {
          const theme = cardThemes[index % cardThemes.length];
          return (
            <button
              onClick={() => handleCurrentIndex(index)}
              key={v.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-[var(--color-nb-border)] bg-white text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--color-nb-shadow)] sm:border-4 sm:hover:-translate-y-2 sm:hover:shadow-[10px_10px_0px_var(--color-nb-shadow)]"
            >
              {/* Thumbnail Container (9:16 aspect ratio for vertical video) */}
              <div className="relative aspect-[9/16] w-full overflow-hidden border-b-2 border-[var(--color-nb-border)] bg-[var(--color-nb-blue)] sm:border-b-4">
                {v.metaData?.thumbnailUrl ? (
                  <Image
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={v.metaData?.thumbnailUrl}
                    alt={v.metaData?.battleTitle ?? "Video thumbnail"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gray-200">
                    <Video className="h-10 w-10 opacity-20 sm:h-16 sm:w-16" />
                    <span className="mt-2 text-xs font-bold text-gray-500 uppercase sm:mt-4 sm:text-sm">
                      Processing...
                    </span>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
                  <div className="nb-border flex h-12 w-12 scale-0 items-center justify-center rounded-full bg-[var(--color-nb-yellow)] opacity-0 shadow-[4px_4px_0_var(--color-nb-shadow)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 sm:h-16 sm:w-16">
                    <Play className="ml-1 h-6 w-6 fill-[var(--color-nb-text)] sm:h-8 sm:w-8" />
                  </div>
                </div>
              </div>

              {/* Card Content Footer */}
              <div
                className={`flex flex-1 flex-col justify-between ${theme?.cardBg} p-3 sm:p-5`}
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-1 sm:mb-3 sm:gap-2">
                    <span
                      className={`nb-border ${theme?.tagBg} px-1.5 py-0.5 text-[10px] font-black tracking-wider text-black uppercase sm:px-2 sm:text-xs`}
                    >
                      Complete
                    </span>
                    <span className="text-xs font-bold text-gray-600 sm:text-sm">
                      {new Date(v.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="line-clamp-1 text-base font-black uppercase sm:text-sm">
                    {v.metaData?.battleTitle}
                  </h3>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {currentIndex !== null && (
        <DiscoverOverlay
          allVideos={allVideos}
          handleCurrentIndex={handleCurrentIndex}
          currentIndex={currentIndex}
          onClose={() => setCurentIndex(null)}
        />
      )}
    </div>
  );
}
