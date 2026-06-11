import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeMint — Lovable.dev Clone",
  description: "Describe any app in plain English. Watch it appear in seconds. A Lovable.dev clone built with Next.js + Claude AI.",
  openGraph: {
    title: "VibeMint — Lovable.dev Clone",
    description: "Describe it. Mint it. Turn any idea into a working app in seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
