import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import {
  buildRootMetadata,
  viewport as viewportConfig,
} from "@/lib/seo.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let appName: string | undefined;
  try {
    const settings = await getSettings();
    appName = settings.app_name || undefined;
  } catch {
    // DB not available yet (first run)
  }
  return buildRootMetadata(appName);
}

export { viewportConfig as viewport };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let defaultTheme = "dark";
  try {
    const settings = await getSettings();
    if (settings.default_theme === "light" || settings.default_theme === "dark") {
      defaultTheme = settings.default_theme;
    }
  } catch {
    // DB not available yet
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <QueryProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </QueryProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
