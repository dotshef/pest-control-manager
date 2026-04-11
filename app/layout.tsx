import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "방역매니저",
  description: "소독 방역업체를 위한 올인원 관리 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2b3a67",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="h-full">{children}</body>
    </html>
  );
}
