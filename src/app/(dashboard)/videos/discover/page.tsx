import { api } from "~/trpc/server";
import DiscoverGrid from "./discoverGrid";
import EmptyGrid from "./emptyGrid";
import DiscoverHeader from "./discoverHeader";

export default async function DiscoverPage() {
  const allVideos = (await api.job.getDiscoverVideos()) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      <DiscoverHeader />
      {allVideos.length === 0 ? (
        <EmptyGrid />
      ) : (
        <DiscoverGrid allVideos={allVideos} />
      )}
    </div>
  );
}
