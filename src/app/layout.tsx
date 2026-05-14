import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shop/Providers";
import Analytics from "@/components/shop/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Entre Maman et Moi · Box culinaires indiennes & ateliers",
    template: "%s | Entre Maman et Moi",
  },
  description:
    "Boxes culinaires indiennes et ateliers de cuisine. Voyagez au cœur de l'Inde depuis votre cuisine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
