import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThesisLens",
  description: "AI-assisted U.S. equity research workspace powered by FMP data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

