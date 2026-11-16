import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { VideoGallery } from "@/components/videos/VideoGallery";
import { getVideos } from "@/server/queries/content";

export const metadata: Metadata = {
  title: "Videos",
  description: "Videoclips oficiales, sesiones en vivo y más de Sleep On a Dream.",
};

export default async function VideosPage() {
  const videos = await getVideos();
  return (
    <>
      <PageHeader eyebrow="Audiovisual" title="Videos" />
      <div className="container-site py-16 md:py-24">
        <VideoGallery videos={videos} />
      </div>
    </>
  );
}
