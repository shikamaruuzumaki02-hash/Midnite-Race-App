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
      <body className="font-body scanline-bg relative">{children}</body>
    </html>
  );
}
