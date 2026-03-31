import "./globals.css";
import type { Metadata } from "next";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/src/components/theme-toggle";

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
