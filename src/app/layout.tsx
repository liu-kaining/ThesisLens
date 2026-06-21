import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThesisLens",
  description: "基于 FMP 数据的美股研究解释层。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
