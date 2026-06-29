import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "易命之书 · 人生答疑",
  description: "输入你的困惑，让《易命之书》52条人生法则为你指点迷津",
  keywords: ["易命之书", "人生法则", "人生答疑", "52条法则", "人生指南"],
  openGraph: {
    title: "易命之书 · 人生答疑",
    description: "输入你的困惑，让《易命之书》52条人生法则为你指点迷津",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "易命之书 · 人生答疑",
    description: "输入你的困惑，让《易命之书》52条人生法则为你指点迷津",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
