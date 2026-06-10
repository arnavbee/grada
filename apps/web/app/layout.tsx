import "./globals.css";
import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Instrument_Serif } from "next/font/google";

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

import { cn } from "@/lib/utils";
import { CustomCursor } from "@/src/components/custom-cursor";

export const metadata: Metadata = {
  title: "grada",
  description: "grada wholesale operations automation",
};

const themeInitScript = `
  (() => {
    try {
      const savedTheme = window.localStorage.getItem('grada-theme');
      const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const nextTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : preferredTheme;
      document.documentElement.dataset.theme = nextTheme;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        instrument.variable,
        "font-sans cursor-none",
      )}
    >
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
