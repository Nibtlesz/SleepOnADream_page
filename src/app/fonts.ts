import { Anton, Inter } from "next/font/google";

export const displayFont = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display-face", display: "swap" });
export const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body-face", display: "swap" });
export const fontClasses = `${displayFont.variable} ${bodyFont.variable} antialiased`;
