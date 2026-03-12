import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { colors } from "../lib/design/tokens";
import AIAssistant from "@/components/AIAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Debut",
  description: "Your stage is ready",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,800,900&display=swap" rel="stylesheet"/>
      </head>
      <body className="font-sans antialiased" style={{ backgroundColor: colors.obsidian, color: colors.white }}>
        {children}
        <AIAssistant />
      </body>
    </html>
  );
}
