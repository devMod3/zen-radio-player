import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zen Radio Player",
  description: "Reproductor institucional de radio y editor privado de playlists.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
