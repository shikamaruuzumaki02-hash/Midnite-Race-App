import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midnite Brasil SSR",
  description: "Gestão de competições de corridas de jogos — Street Series",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff5a1f" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MidniteBR" />
      </head>
      <body className="font-body scanline-bg relative">{children}</body>
    </html>
  );
}
