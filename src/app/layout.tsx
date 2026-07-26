import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SafetyToast } from "@/components/safety-toast";
import { CommandPaletteProvider } from "@/components/command-palette";
import { RegionContextProvider } from "@/components/region-context";
import { getRegions, buildSearchIndex, DEFAULT_REGION_CODE } from "@/lib/data";

const geistSans = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://streamdock.rexd.space"),
  title: {
    default: "StreamDock — The Ultimate Stream Collection",
    template: "%s · StreamDock",
  },
  description:
    "A curated, regional list of free streaming sites — movies, TV shows, anime, manga, live TV, sports and more. Fast fuzzy search, multi-region, no ads on us.",
  applicationName: "StreamDock",
  keywords: [
    "streaming sites",
    "free movies",
    "free tv shows",
    "anime streaming",
    "manga reader",
    "live tv",
    "sports streams",
    "fmhy alternative",
    "best streaming list",
    "streamdock",
  ],
  authors: [{ name: "StreamDock Team", url: "https://streamdock.rexd.space" }],
  creator: "StreamDock Team",
  publisher: "StreamDock",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "StreamDock",
    title: "StreamDock — The Ultimate Stream Collection",
    description:
      "A curated, regional list of free streaming sites — movies, anime, manga, live TV and more.",
    url: "https://streamdock.rexd.space",
    locale: "en_US",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "StreamDock — The Ultimate Stream Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamDock — The Ultimate Stream Collection",
    description:
      "Curated streaming sites for movies, anime, manga, live TV and more — fast fuzzy search, multi-region.",
    images: ["/banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "entertainment",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const regions = await getRegions();
  const searchIndex = await buildSearchIndex(DEFAULT_REGION_CODE);

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <RegionContextProvider regions={regions} current={DEFAULT_REGION_CODE}>
            <CommandPaletteProvider initialIndex={searchIndex} regions={regions}>
              <Navbar />
              <div className="relative z-10">{children}</div>
              <Footer />
              <SafetyToast />
            </CommandPaletteProvider>
          </RegionContextProvider>
        </ThemeProvider>

      </body>
    </html>
  );
}
