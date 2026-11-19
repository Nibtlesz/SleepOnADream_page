import localFont from "next/font/local";
import { Anton, Inter } from "next/font/google";

export const displayFont = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display-face", display: "swap" });
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });

/**
 * Acento caligráfico: Handstand (Areatype), solo en el título "Merch oficial" de la portada.
 * ⚠️ Fuente comercial: publicarla en el sitio requiere la licencia webfont de Areatype.
 */
export const scriptFont = localFont({
  src: "../assets/fonts/Handstand.woff2",
  variable: "--font-script-face",
  display: "swap",
  // Handstand es mucho más ancha que Anton: se escala para ocupar un espacio parecido.
  declarations: [{ prop: "size-adjust", value: "80%" }],
});

export const fontClasses = `${displayFont.variable} ${bodyFont.variable} ${scriptFont.variable} antialiased`;
