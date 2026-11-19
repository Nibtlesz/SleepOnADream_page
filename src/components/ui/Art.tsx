/**
 * Arte PROVISIONAL generado en SVG (sin peso de imágenes) mientras no existan
 * fotografías ni portadas oficiales. Se sustituye por <Image> cuando el producto,
 * lanzamiento o integrante tenga `imageUrl` cargada desde el panel.
 */
import Image from "next/image";
import type { ArtKind } from "@/lib/types";
import { cn } from "@/lib/cn";

const GARMENT_FILL: Record<string, { fill: string; ink: string }> = {
  Negro: { fill: "#141416", ink: "#ecebe8" },
  Blanco: { fill: "#e6e4df", ink: "#0e0e10" },
  "Gris carbón": { fill: "#3a3a40", ink: "#ecebe8" },
  Rojo: { fill: "#7d0d15", ink: "#ecebe8" },
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function ProductArt({
  kind,
  color,
  className,
}: {
  kind: ArtKind;
  color?: string | null;
  className?: string;
}) {
  const g = GARMENT_FILL[color ?? "Negro"] ?? GARMENT_FILL.Negro;
  const stroke = "#3a3a41";
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#1d1d21_0%,#0e0e10_70%)]",
        className,
      )}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto h-[78%] w-[78%]" role="img" aria-label={`Ilustración provisional: ${kind}`}>
        <defs>
          <radialGradient id="shine" cx="40%" cy="30%" r="80%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {kind === "tee" && (
          <g>
            <path d="M72 38 L52 44 L26 66 L40 92 L58 82 L58 168 L142 168 L142 82 L160 92 L174 66 L148 44 L128 38 Q100 58 72 38 Z" fill={g.fill} stroke={stroke} strokeWidth="1.2" />
            <path d="M72 38 L52 44 L26 66 L40 92 L58 82 L58 168 L142 168 L142 82 L160 92 L174 66 L148 44 L128 38 Q100 58 72 38 Z" fill="url(#shine)" />
            <text x="100" y="98" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="15" letterSpacing="1" fill={g.ink}>SLEEP ON</text>
            <text x="100" y="114" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="15" letterSpacing="1" fill={g.ink}>A DREAM</text>
            <rect x="86" y="120" width="28" height="1.5" fill="#e0262f" />
          </g>
        )}
        {kind === "hoodie" && (
          <g>
            <path d="M76 40 Q100 14 124 40 L150 50 L174 124 L156 130 L142 92 L142 170 L58 170 L58 92 L44 130 L26 124 L50 50 Z" fill={g.fill} stroke={stroke} strokeWidth="1.2" />
            <path d="M76 40 Q100 66 124 40" fill="none" stroke={stroke} strokeWidth="1.5" />
            <path d="M94 58 L92 82 M106 58 L108 82" stroke={stroke} strokeWidth="1" />
            <rect x="74" y="128" width="52" height="24" rx="3" fill="none" stroke={stroke} strokeWidth="1.2" />
            <text x="100" y="108" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="12" letterSpacing="2" fill={g.ink}>S · O · A · D</text>
            <path d="M76 40 Q100 14 124 40 L150 50 L174 124 L156 130 L142 92 L142 170 L58 170 L58 92 L44 130 L26 124 L50 50 Z" fill="url(#shine)" />
          </g>
        )}
        {kind === "cap" && (
          <g>
            <path d="M46 122 Q44 62 100 58 Q156 62 154 122 Z" fill={g.fill} stroke={stroke} strokeWidth="1.2" />
            <path d="M100 58 L100 122 M72 66 Q66 92 68 122 M128 66 Q134 92 132 122" stroke={stroke} strokeWidth="1" fill="none" />
            <path d="M40 122 Q100 112 178 130 Q172 144 150 140 Q100 130 44 134 Z" fill={g.fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="100" cy="58" r="3" fill={stroke} />
            <text x="100" y="104" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="14" fill={g.ink}>SOAD</text>
          </g>
        )}
        {kind === "vinyl" && (
          <g>
            <rect x="22" y="40" width="120" height="120" fill="#1a1a1e" stroke={stroke} />
            <text x="34" y="62" fontFamily="Impact, sans-serif" fontSize="11" fill="#8d8d96">SLEEP ON A DREAM</text>
            <circle cx="122" cy="100" r="58" fill="#050506" stroke="#2a2a2f" />
            {[50, 44, 38, 32].map((r) => (
              <circle key={r} cx="122" cy="100" r={r} fill="none" stroke="#1d1d22" strokeWidth="0.8" />
            ))}
            <circle cx="122" cy="100" r="18" fill="#a50f1a" />
            <circle cx="122" cy="100" r="2.5" fill="#050506" />
          </g>
        )}
        {kind === "cd" && (
          <g>
            <rect x="40" y="40" width="120" height="120" fill="#17171a" stroke={stroke} />
            <circle cx="100" cy="100" r="50" fill="url(#cdg)" stroke="#55555c" />
            <defs>
              <linearGradient id="cdg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c9c9cf" />
                <stop offset="0.5" stopColor="#5d5d66" />
                <stop offset="1" stopColor="#d7d6dc" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="14" fill="#17171a" stroke="#55555c" />
            <circle cx="100" cy="100" r="4" fill="#0e0e10" />
          </g>
        )}
        {kind === "patch" && (
          <g>
            <rect x="38" y="62" width="124" height="76" rx="10" fill="#141416" stroke="#a50f1a" strokeWidth="3" />
            <rect x="45" y="69" width="110" height="62" rx="6" fill="none" stroke="#ecebe8" strokeWidth="1" strokeDasharray="3 3" />
            <text x="100" y="98" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="16" fill="#ecebe8">SLEEP ON</text>
            <text x="100" y="118" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="16" fill="#e0262f">A DREAM</text>
          </g>
        )}
        {kind === "tote" && (
          <g>
            <path d="M78 70 Q78 34 100 34 Q122 34 122 70" fill="none" stroke="#cfccc4" strokeWidth="4" />
            <rect x="52" y="66" width="96" height="108" fill="#d9d5cc" stroke="#a9a59b" />
            <text x="100" y="124" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="14" fill="#0e0e10">SLEEP ON A DREAM</text>
          </g>
        )}
        {kind === "bundle" && (
          <g>
            <path d="M52 52 L40 56 L22 70 L32 88 L44 82 L44 150 L112 150 L112 82 L124 88 L134 70 L116 56 L104 52 Q78 66 52 52 Z" fill={g.fill} stroke={stroke} />
            <rect x="100" y="96" width="70" height="70" fill="#17171a" stroke={stroke} />
            <circle cx="135" cy="131" r="28" fill="#4a4a52" stroke="#6b6b73" />
            <circle cx="135" cy="131" r="7" fill="#17171a" />
            <rect x="120" y="44" width="54" height="34" rx="5" fill="#141416" stroke="#a50f1a" strokeWidth="2" />
            <text x="147" y="65" textAnchor="middle" fontFamily="Impact, sans-serif" fontSize="9" fill="#ecebe8">SOAD</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/** Portada abstracta determinista para lanzamientos sin arte oficial. */
export function CoverArt({
  seed,
  title,
  src,
  className,
}: {
  seed: string;
  title: string;
  /** Portada oficial; sin ella se dibuja el arte provisional. */
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative aspect-square w-full overflow-hidden bg-coal", className)}>
        <Image src={src} alt={title} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
      </div>
    );
  }
  const h = hash(seed);
  const rings = 5 + (h % 5);
  const cx = 30 + (h % 40);
  const cy = 30 + ((h >> 4) % 40);
  return (
    <div className={cn("relative aspect-square w-full overflow-hidden bg-coal", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label={`Portada provisional de ${title}`}>
        <defs>
          <radialGradient id={`g-${h}`} cx={`${cx}%`} cy={`${cy}%`} r="70%">
            <stop offset="0" stopColor="#a50f1a" stopOpacity="0.85" />
            <stop offset="0.45" stopColor="#2a0306" stopOpacity="0.9" />
            <stop offset="1" stopColor="#070708" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#g-${h})`} />
        {Array.from({ length: rings }, (_, i) => (
          <circle key={i} cx={cx} cy={cy} r={6 + i * 7} fill="none" stroke="#ecebe8" strokeOpacity={0.05 + i * 0.015} strokeWidth="0.3" />
        ))}
        <line x1="0" y1={cy + 18} x2="100" y2={cy + 18} stroke="#ecebe8" strokeOpacity="0.12" strokeWidth="0.25" />
        <text x="6" y="92" fontFamily="Impact, sans-serif" fontSize="5" letterSpacing="0.6" fill="#ecebe8" fillOpacity="0.7">
          SLEEP ON A DREAM
        </text>
      </svg>
    </div>
  );
}

/** Marcador de fotografía (banda, en vivo, prensa). */
export function PhotoPlaceholder({
  label = "Fotografía de ejemplo",
  className,
  tone = "dark",
}: {
  label?: string;
  className?: string;
  tone?: "dark" | "red";
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative overflow-hidden",
        tone === "red"
          ? "bg-[radial-gradient(ellipse_at_30%_20%,#5a0810_0%,#170204_55%,#070708_100%)]"
          : "bg-[radial-gradient(ellipse_at_70%_10%,#2b2b31_0%,#111114_50%,#070708_100%)]",
        className,
      )}
    >
      {/* Siluetas abstractas */}
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full opacity-60" aria-hidden>
        <path d="M0 60 L0 44 Q8 38 14 42 Q18 30 24 34 Q30 26 36 36 Q42 30 48 38 Q55 28 62 36 Q68 30 74 40 Q82 32 88 42 Q94 38 100 44 L100 60 Z" fill="#050506" />
      </svg>
      <span className="absolute bottom-3 left-3 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-fog">{label}</span>
    </div>
  );
}
