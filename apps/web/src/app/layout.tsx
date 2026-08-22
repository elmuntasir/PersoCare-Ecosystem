import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PersoCare",
  description: "One platform for your care — hospitals, clinics, and pharmacies, connected.",
  appleWebApp: {
    capable: false,
    title: "PersoCare",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f3b34",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f3b34" />
      </head>
      <body className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
