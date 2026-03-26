import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShellProvider } from "@/app-shell/AppShellProvider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GREY-EARTH — SIGINT-TERRAIN",
  description: "Tactical geospatial intelligence platform — SIGINT-TERRAIN v1.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[#0d0f0e] text-[rgba(255,255,255,0.88)] font-mono">
        <AppShellProvider>
          {children}
        </AppShellProvider>
      </body>
    </html>
  );
}
