import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS ? "/peelpop" : "";

export const metadata: Metadata = {
  title: "PeelPop! — Cute Background Remover",
  description: "Remove image backgrounds in your browser and download a clean transparent PNG.",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
