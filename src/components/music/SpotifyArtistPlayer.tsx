import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Reproductor oficial de Spotify con el perfil de artista (top tracks y discografía).
 * Se carga en diferido: el iframe no se descarga hasta acercarse a la vista.
 */
export function SpotifyArtistPlayer({ className, title }: { className?: string; title: string }) {
  const src = `https://open.spotify.com/embed/artist/${siteConfig.spotifyArtistId}?utm_source=generator&theme=0`;
  return (
    <div className={cn("overflow-hidden rounded-xl bg-coal", className)}>
      <iframe
        src={src}
        title={title}
        width="100%"
        height="352"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block border-0"
      />
    </div>
  );
}
