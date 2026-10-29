import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

export const metadata: Metadata = {
  title: "LifeSpace — be productive",
  description:
    "LifeSpace is a calendar-based task and habit organizer with monthly goals, weekly progress and daily completion charts. Use it instantly as a guest, or sign in to save your progress.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f6fb0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="sheet-paper min-h-screen text-sheet-ink antialiased">
        {children}
      </body>
    </html>
  );
}
