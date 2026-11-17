import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BackgroundCollector } from "@/components/background-collector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chase The Train | 铁路迷的探索与记录空间",
  description: "探索车站、线路与列车，记录每一次乘车和拍车。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} dark scheme-dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><BackgroundCollector />{children}</body>
    </html>
  );
}
