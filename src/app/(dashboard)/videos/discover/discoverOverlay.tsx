import React, { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import DiscoverPlayer from "./discoverPlayer";
import type { LiveStateType } from "~/lib/pipeline/helper/createEmptyPreviewState";

type DiscoverOverlayType = {
  allVideos: {
    id: string;
    metaData: {
      battleTitle: string;
      shortSubtitle: string;
      thumbnailUrl: string;
    } | null;
    createdAt: Date;
  }[];
  currentIndex: number;
  handleCurrentIndex: (index: number) => void;
  onClose: () => void;
};

function VideoSlot({
  manifest,
  isActive,
  title,
  subtitle,
}: {
  manifest: LiveStateType | null | undefined;
  isActive: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative flex h-[100dvh] w-full snap-start items-center justify-center bg-black md:bg-transparent">
      {/* Video Container */}
      <div className="relative flex h-full w-full overflow-hidden bg-black sm:h-[calc(100vh-4rem)] sm:max-w-[calc((100vh-4rem)*9/16)] sm:rounded-xl sm:border-4 sm:border-black sm:shadow-[4px_4px_0_var(--color-nb-shadow)]">
        {/* Player */}
        <div className="absolute inset-0 h-full w-full">
          {manifest && (
            <DiscoverPlayer videoManifest={manifest} isActive={isActive} />
          )}
        </div>

        {/* Action buttons (Mobile) — inside the video relative container, bottom right */}
        <div className="absolute right-4 bottom-24 z-10 flex flex-col items-center gap-5 sm:hidden">
          <button className="nb-border flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-nb-pink)] shadow-[2px_2px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
            <Heart className="h-6 w-6 fill-white text-white" />
          </button>
          <button className="nb-border flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-nb-blue)] shadow-[2px_2px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
            <MessageCircle className="h-6 w-6 text-white" />
          </button>
          <button className="nb-border flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-nb-yellow)] shadow-[2px_2px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
            <Share2 className="h-6 w-6 text-[var(--color-nb-text)]" />
          </button>
        </div>

        {/* Gradient backdrop to ensure text is visible over the video without blocking it */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Title — bottom left over video (transparent with drop shadow) */}
        {(title ?? subtitle) && (
          <div className="absolute right-20 bottom-8 left-4 z-10 flex flex-col items-start gap-1 sm:right-24 sm:bottom-6 sm:left-6">
            <div
              className="group flex cursor-pointer flex-col items-start"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {title && (
                <div className="flex items-end gap-2">
                  <h3
                    className={`w-full text-sm font-bold text-balance text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-base ${isExpanded ? "" : "line-clamp-1"}`}
                  >
                    {title}
                  </h3>
                  {!isExpanded && (
                    <span className="text-xs font-bold text-white/80 drop-shadow hover:text-white">
                      ...more
                    </span>
                  )}
                </div>
              )}
              {subtitle && (
                <p
                  className={`mt-1 max-w-sm text-xs font-semibold text-balance text-gray-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-sm ${isExpanded ? "" : "hidden"}`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons (Desktop) — positioned outside */}
      <div className="mb-12 ml-6 hidden flex-col items-center gap-5 self-end sm:flex">
        <button className="nb-border flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-nb-pink)] shadow-[3px_3px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
          <Heart className="h-7 w-7 fill-white text-white" />
        </button>
        <button className="nb-border flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-nb-blue)] shadow-[3px_3px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
          <MessageCircle className="h-7 w-7 text-white" />
        </button>
        <button className="nb-border flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-nb-yellow)] shadow-[3px_3px_0_var(--color-nb-shadow)] transition-transform hover:scale-110">
          <Share2 className="h-7 w-7 text-[var(--color-nb-text)]" />
        </button>
      </div>
    </div>
  );
}

export default function DiscoverOverlay({
  allVideos,
  currentIndex,
  handleCurrentIndex,
  onClose,
}: DiscoverOverlayType) {
  const currentVideo = allVideos[currentIndex];
  const prevVideo = allVideos[currentIndex - 1];
  const nextVideo = allVideos[currentIndex + 1];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allVideos.length - 1;

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Scroll detection: figure out which slot the user landed on
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      const slotIndex = Math.round(container.scrollTop / window.innerHeight);

      if (hasPrev) {
        if (slotIndex === 0) handleCurrentIndex(currentIndex - 1);
        else if (slotIndex === 2 && hasNext)
          handleCurrentIndex(currentIndex + 1);
      } else {
        if (slotIndex === 1 && hasNext) handleCurrentIndex(currentIndex + 1);
      }
    };

    container.addEventListener("scrollend", handleScrollEnd);
    return () => container.removeEventListener("scrollend", handleScrollEnd);
  }, [currentIndex, handleCurrentIndex, hasPrev, hasNext]);

  // After currentIndex changes, reset scroll to the current video's slot
  useEffect(() => {
    containerRef.current?.scrollTo({
      top: hasPrev ? window.innerHeight : 0,
      behavior: "instant",
    });
  }, [currentIndex, hasPrev]);

  const currentManifest = api.job.getPublicManifest.useQuery(
    { jobId: currentVideo?.id ?? "" },
    { enabled: !!currentVideo },
  );

  const previousManifest = api.job.getPublicManifest.useQuery(
    { jobId: prevVideo?.id ?? "" },
    { enabled: !!prevVideo },
  );

  const nextManifest = api.job.getPublicManifest.useQuery(
    { jobId: nextVideo?.id ?? "" },
    { enabled: !!nextVideo },
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 snap-y snap-mandatory overflow-y-auto bg-black"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="nb-border fixed top-4 right-4 z-60 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-nb-orange)] shadow-[3px_3px_0_var(--color-nb-shadow)] transition-transform hover:scale-110"
      >
        <X className="h-5 w-5 text-[var(--color-nb-text)]" />
      </button>

      {hasPrev && (
        <VideoSlot
          key={prevVideo?.id}
          manifest={previousManifest.data}
          isActive={false}
          title={prevVideo?.metaData?.battleTitle}
          subtitle={prevVideo?.metaData?.shortSubtitle}
        />
      )}

      <VideoSlot
        key={currentVideo?.id}
        manifest={currentManifest.data}
        isActive={true}
        title={currentVideo?.metaData?.battleTitle}
        subtitle={currentVideo?.metaData?.shortSubtitle}
      />

      {hasNext && (
        <VideoSlot
          key={nextVideo?.id}
          manifest={nextManifest.data}
          isActive={false}
          title={nextVideo?.metaData?.battleTitle}
          subtitle={nextVideo?.metaData?.shortSubtitle}
        />
      )}
    </div>
  );
}
