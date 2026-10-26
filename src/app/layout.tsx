import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyRush - Premium Crash Game",
  description: "Experience the ultimate high-speed crash game with stunning visuals and fast-paced gameplay.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
