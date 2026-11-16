import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionHeading";
import { VideoGallery } from "@/components/videos/VideoGallery";
import { getI18n, pageAlternates } from "@/i18n/server";
import { getVideos } from "@/server/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.videos.title, description: t.meta.videos.description, alternates: await pageAlternates("/videos") };
}

export default async function VideosPage() {
  const { t } = await getI18n();
  const videos = await getVideos();
  return (
    <>
      <PageHeader eyebrow={t.videos.eyebrow} title={t.nav.videos} />
      <div className="container-site py-16 md:py-24">
        <VideoGallery videos={videos} />
      </div>
    </>
  );
}
