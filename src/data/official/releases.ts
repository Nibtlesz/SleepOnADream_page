/**
 * Lanzamientos OFICIALES de la banda, tomados de su catálogo en Apple Music y Spotify
 * (fechas, canciones, duraciones, sellos y portadas). Se cargan con el seed y se muestran
 * cuando el sitio funciona sin base de datos. Para agregar más, usa el panel (/admin/musica)
 * o añádelos aquí. El primero con `isFeatured` (o el más reciente) aparece en la portada.
 */
import type { Release } from "@/lib/types";

type Track = [title: string, duration: string];

const SPOTIFY_COVER = (hash: string) => `https://i.scdn.co/image/ab67616d0000b273${hash}`;
const APPLE_COVER = (path: string) => `https://is1-ssl.mzstatic.com/image/thumb/${path}/600x600bb.jpg`;

function release(r: {
  slug: string;
  title: string;
  type: Release["type"];
  date: string;
  description: string;
  cover: string;
  tracks: Track[];
  spotifyId?: string;
  /** Para sencillos con enlace a la canción en vez del álbum (open.spotify.com/track/…). */
  spotifyTrackId?: string;
  apple: string;
  youtubeMusic?: string;
  isFeatured?: boolean;
}): Release {
  return {
    slug: r.slug,
    title: r.title,
    type: r.type,
    // Medianoche del centro de México (06:00 UTC) para que la fecha no se recorra.
    releaseDate: `${r.date}T06:00:00.000Z`,
    description: r.description,
    coverImageUrl: r.cover,
    tracks: r.tracks.map(([title, duration], i) => {
      const [m, s] = duration.split(":").map(Number);
      return { position: i + 1, title, durationS: m * 60 + s };
    }),
    links: {
      spotify: r.spotifyId
        ? `https://open.spotify.com/album/${r.spotifyId}`
        : r.spotifyTrackId
          ? `https://open.spotify.com/track/${r.spotifyTrackId}`
          : null,
      appleMusic: `https://music.apple.com/mx/album/${r.apple}`,
      youtubeMusic: r.youtubeMusic ?? null,
    },
    embedUrl: r.spotifyId
      ? `https://open.spotify.com/embed/album/${r.spotifyId}?theme=0`
      : r.spotifyTrackId
        ? `https://open.spotify.com/embed/track/${r.spotifyTrackId}?theme=0`
        : null,
    isFeatured: r.isFeatured ?? false,
    isSample: false,
  };
}

export const officialReleases: Release[] = [
  release({
    slug: "ruinas",
    title: "Ruinas",
    type: "SINGLE",
    date: "2026-11-20",
    description: "Sencillo. ℗ 2026 Darklex Studios.",
    cover: APPLE_COVER("Music211/v4/83/cb/8e/83cb8ead-5e33-70d0-dcdb-d8b9c52f665e/708208388097_cover.jpg"),
    tracks: [["Ruinas", "3:48"]],
    spotifyTrackId: "2SadOvrGcJBCme02YqAJfi",
    apple: "ruinas-single/6827192499",
    youtubeMusic: "https://music.youtube.com/watch?v=2I4wkmouAmc",
    isFeatured: true,
  }),
  release({
    slug: "supernova",
    title: "Supernova",
    type: "SINGLE",
    date: "2026-07-03",
    description: "Sencillo. ℗ 2026 Darklex Studios.",
    cover: SPOTIFY_COVER("f997a6ba80fd096fd4ae622c"),
    tracks: [["Supernova", "3:54"]],
    spotifyId: "5D4CMw51liWhh0iyTqRdLb",
    apple: "supernova-single/6779373419",
  }),
  release({
    slug: "un-mejor-final",
    title: "Un Mejor Final",
    type: "SINGLE",
    date: "2026-02-26",
    description: "Sencillo. ℗ 2026 Darklex Studios.",
    cover: SPOTIFY_COVER("735c40a98d63384b503ebf72"),
    tracks: [["Un Mejor Final", "3:33"]],
    spotifyId: "6vvDVff5QFCqtsxQqsqsCZ",
    apple: "un-mejor-final-single/1875328799",
  }),
  release({
    slug: "salvame",
    title: "Sálvame (feat. Bam Bautista)",
    type: "SINGLE",
    date: "2025-08-15",
    description: "Sencillo con Bam Bautista. ℗ 2025 Darklex Studios.",
    cover: SPOTIFY_COVER("ce4d81f72a134b26cf0cfb43"),
    tracks: [["Sálvame (feat. Bam Bautista)", "4:24"]],
    spotifyId: "2L6yYjFyIW2LfKto3SUFyD",
    apple: "s%C3%A1lvame-feat-bam-bautista-single/1828791893",
  }),
  release({
    slug: "amor-regresa",
    title: "Amor Regresa",
    type: "SINGLE",
    date: "2025-03-28",
    description: "Sencillo. ℗ 2025 Alien House Productions.",
    cover: SPOTIFY_COVER("17c370666e6bfeb84d86406b"),
    tracks: [["Amor Regresa", "3:37"]],
    spotifyId: "2V71r1i7Y2ay400yad2tr4",
    apple: "amor-regresa-single/1810740309",
  }),
  release({
    slug: "fragmentos-instrumental",
    title: "Fragmentos (Instrumental)",
    type: "EP",
    date: "2024-01-25",
    description: "Versión instrumental del EP Fragmentos. ℗ 2024 Darklex Records.",
    cover: SPOTIFY_COVER("3110e4584e5c099e838652dc"),
    tracks: [
      ["Fragmentos (Instrumental)", "1:30"],
      ["Despertar (Instrumental)", "4:04"],
      ["Voces (Instrumental)", "5:06"],
      ["Ecos (Instrumental)", "4:38"],
      ["Eclipse (Instrumental)", "3:47"],
      ["Renacer (Instrumental)", "5:33"],
    ],
    spotifyId: "2mnDQ8obSCaEUIl6pdcJKo",
    apple: "fragmentos-instrumental-ep/1809414908",
  }),
  release({
    slug: "fragmentos",
    title: "Fragmentos",
    type: "EP",
    date: "2023-08-03",
    description: "EP de seis canciones. ℗ 2023 Darklex Records.",
    cover: SPOTIFY_COVER("5b7d49ca39e0f6fa5a360202"),
    tracks: [
      ["Fragmentos", "1:30"],
      ["Despertar", "4:04"],
      ["Voces", "5:06"],
      ["Ecos", "4:38"],
      ["Eclipse", "3:47"],
      ["Renacer", "5:32"],
    ],
    spotifyId: "5eiGKjN78iR9nxSGhBfBUg",
    apple: "fragmentos-ep/1810740783",
    youtubeMusic: "https://music.youtube.com/playlist?list=OLAK5uy_n1b6AoMQ1CgkHk3INDF7WVe1Ci18NXb-0",
  }),
  release({
    slug: "live-from-home",
    title: "Live From Home",
    type: "SINGLE",
    date: "2022-07-01",
    description: "Tres canciones en vivo. ℗ 2022 Darklex Records.",
    cover: APPLE_COVER("Music221/v4/96/1a/57/961a571a-d15b-d563-f0d6-c1150292863a/197045523219_cover.jpg"),
    tracks: [
      ["Antes de todo, después de ti (Live)", "4:08"],
      ["Cicatrices (Live)", "3:04"],
      ["Voces (Live)", "4:48"],
    ],
    apple: "live-from-home-single/1810748176",
  }),
  release({
    slug: "antes-de-todo-despues-de-ti",
    title: "Antes de todo, después de ti",
    type: "SINGLE",
    date: "2021-01-14",
    description: "Sencillo. ℗ 2021 Darklex Records.",
    cover: SPOTIFY_COVER("72c9f30b803af353f823eba0"),
    tracks: [["Antes de todo, después de ti", "4:11"]],
    spotifyId: "1PGuR6vFsB2fcfHU7w2dAE",
    apple: "antes-de-todo-despu%C3%A9s-de-ti-single/1810767309",
  }),
  release({
    slug: "voces",
    title: "Voces",
    type: "SINGLE",
    date: "2020-09-13",
    description: "Sencillo. ℗ 2020 Darklex Records.",
    cover: SPOTIFY_COVER("f86898e0f739803d23826154"),
    tracks: [["Voces", "4:47"]],
    spotifyId: "49GLwKIEzx6jVYvAKEHSXd",
    apple: "voces-single/1808250485",
  }),
  release({
    slug: "in-the-end",
    title: "In the End",
    type: "SINGLE",
    date: "2020-08-01",
    description: "Cover de Linkin Park. ℗ 2020 Darklex Records.",
    cover: APPLE_COVER("Music221/v4/3d/47/aa/3d47aafb-5034-4ee2-fdc7-108b778e369a/195398114252_cover.jpg"),
    tracks: [["In the End", "3:37"]],
    apple: "in-the-end-single/1810767434",
  }),
  release({
    slug: "renacer",
    title: "Renacer",
    type: "SINGLE",
    date: "2020-04-10",
    description: "Sencillo. ℗ 2020 Darklex Records.",
    cover: SPOTIFY_COVER("bc0341c9f4bdc6ae8454f3b3"),
    tracks: [["Renacer", "5:33"]],
    spotifyId: "39xHv8hwynIsOlrISuJmwo",
    apple: "renacer-single/1808102610",
  }),
  release({
    slug: "cicatrices",
    title: "Cicatrices",
    type: "SINGLE",
    date: "2018-07-11",
    description: "Sencillo. ℗ 2018 Bru Records.",
    cover: SPOTIFY_COVER("169e35217bc81fa23ebd4397"),
    tracks: [["Cicatrices", "3:01"]],
    spotifyId: "12IaFTeBDqSUEO3NXYyRDA",
    apple: "cicatrices-single/1809417753",
  }),
];
