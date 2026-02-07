import { Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import localFont from "next/font/local";

/* Custom Fonts */

// Next.js resolves paths at build time, so this needs to be static string
const laroSoft = localFont({
  src: "../../public/fonts/Laro-Soft-Regular.ttf",
  display: "swap",
  variable: "--font-laro-soft",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const customFonts = {
  laroSoft,
  dmSans,
  montserrat,
};

/* Viewport Configuration */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};
