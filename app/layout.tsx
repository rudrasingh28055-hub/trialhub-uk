import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AthLink",
  description: "Connecting athletes to opportunity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
