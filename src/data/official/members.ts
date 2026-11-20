/**
 * Integrantes OFICIALES de la banda, en el orden en que aparecen en "Nosotros".
 * Fotos en public/images/band/ (recortadas a 3:4; foto: Noridexs). Roles en español:
 * la versión en inglés los traduce con `memberRole()`.
 */
import type { BandMember } from "@/lib/types";

export const officialMembers: BandMember[] = [
  { id: "malex", name: "Alex “Malex” Bravo", role: "Batería", photoUrl: "/images/band/malex.jpg" },
  { id: "kalel", name: "Luis “Kalel” Icasbalceta", role: "Guitarra y coros", photoUrl: "/images/band/kalel.jpg" },
  { id: "nusa", name: "Emmanuel “Nusa” Ostria", role: "Bajo y guturales", photoUrl: "/images/band/nusa.jpg" },
  { id: "lalo", name: "Eduardo “Lalo” Navarrete", role: "Voz y guturales", photoUrl: "/images/band/lalo.jpg" },
  { id: "benji", name: "Benjamin “Benji” Cervantes", role: "Guitarra", photoUrl: "/images/band/benji.jpg" },
];
