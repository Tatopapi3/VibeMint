import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeMint — Plan it. Build it. Understand it.",
  description: "Describe any app in plain English. Watch it appear in seconds. Built with Next.js + Claude AI.",
  openGraph: {
    title: "VibeMint — Plan it. Build it. Understand it.",
    description: "Describe it. Mint it. Turn any idea into a working app in seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
