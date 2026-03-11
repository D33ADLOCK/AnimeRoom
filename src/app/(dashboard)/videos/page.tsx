import Link from "next/link";
import { api } from "~/trpc/server";
import { Video, Play } from "lucide-react";

export default async function Page() {
  const myVideos = (await api.job.getMyVideos()) ?? [];

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      {/* Header Section */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end sm:gap-6">
        <div>
          <h1 className="flex items-center gap-2 text-4xl font-black tracking-tight uppercase sm:gap-3 sm:text-6xl">
            <span
              className="text-[var(--color-nb-mint)] drop-shadow-[3px_3px_0_var(--color-nb-border)] sm:drop-shadow-[4px_4px_0_var(--color-nb-border)]"
              style={{ WebkitTextStroke: "2px var(--color-nb-border)" }}
            >
              MY
            </span>
            <span className="nb-border -rotate-2 transform bg-[var(--color-nb-pink)] px-3 py-1 text-white shadow-[4px_4px_0_var(--color-nb-shadow)] sm:px-4 sm:shadow-[6px_6px_0_var(--color-nb-shadow)]">
              VIDEOS
            </span>
          </h1>
          <p className="mt-2 text-base font-bold text-[var(--color-nb-text)]/70 sm:mt-6 sm:text-lg">
            View and manage your generated roast battles.
          </p>
        </div>
        <Link
          href="/create"
          className="nb-btn w-full bg-[var(--color-nb-yellow)] px-6 py-3 text-center text-lg sm:w-auto"
        >
          Create New
        </Link>
      </div>

      {myVideos.length === 0 ? (
        /* Empty State */
        <div className="nb-card flex min-h-[40vh] flex-col items-center justify-center bg-[var(--color-nb-lavender)] px-4 py-10 text-center sm:p-12">
          <div className="nb-border mb-6 rounded-full bg-white p-4 shadow-[4px_4px_0_var(--color-nb-shadow)] sm:p-6 sm:shadow-[6px_6px_0_var(--color-nb-shadow)]">
            <Video className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <h2 className="mb-2 text-2xl font-black uppercase sm:mb-4 sm:text-3xl">
            No Videos Yet
          </h2>
          <p className="mb-6 max-w-md text-base font-bold text-[var(--color-nb-text)]/80 sm:mb-8 sm:text-lg">
            You haven't generated any roast battles yet. Time to spark some
            chaos!
          </p>
          <Link
            href="/create"
            className="nb-btn bg-[var(--color-nb-yellow)] px-6 py-3 text-lg sm:px-8 sm:py-4 sm:text-xl"
          >
            Start Your First Roast
          </Link>
        </div>
      ) : (
        /* Videos Grid */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4 xl:gap-10">
          {myVideos.map((v, index) => {
            const theme = cardThemes[index % cardThemes.length];
            return (
              <Link
                href={`/videos/${v.id}`}
                key={v.id}
                className="nb-card group relative flex flex-col overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-nb-shadow)] sm:hover:-translate-y-2 sm:hover:shadow-[8px_8px_0px_var(--color-nb-shadow)]"
              >
                {/* Thumbnail Container (9:16 aspect ratio for vertical video) */}
                <div className="relative aspect-[9/16] w-full overflow-hidden border-b-[2px] border-[var(--color-nb-border)] bg-[var(--color-nb-blue)] sm:border-b-[3px]">
                  {v.thumbnailUrl?.publicUrl ? (
                    <img
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={v.thumbnailUrl.publicUrl}
                      alt={v.thumbnailUrl.fileName ?? "Video thumbnail"}
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
                  className={`flex flex-1 flex-col justify-between ${theme.cardBg} border-t-[3px] border-[var(--color-nb-border)] p-3 sm:p-5`}
                >
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-1 sm:mb-3 sm:gap-2">
                      <span
                        className={`nb-border ${theme.tagBg} px-1.5 py-0.5 text-[10px] font-black tracking-wider text-black uppercase sm:px-2 sm:text-xs`}
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

                    <h3 className="line-clamp-1 text-base font-black uppercase sm:text-xl">
                      Roast Battle
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
