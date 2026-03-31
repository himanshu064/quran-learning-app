import type { Metadata, Viewport } from "next";

/**
 * Centralized SEO configuration.
 * All pages inherit from this via the root layout's title.template.
 * To change the app name, update the `app_name` site setting in admin.
 *
 * Usage in pages:
 *   export const metadata: Metadata = { title: "Sign In" };
 *   // Renders as: "Sign In | Quran Learning App"
 *
 * Usage for dynamic pages:
 *   export async function generateMetadata({ params }) {
 *     return { title: `User: ${name}` };
 *   }
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const DEFAULT_APP_NAME = "Quran Learning App";

export const seoConfig = {
  defaultTitle: DEFAULT_APP_NAME,
  titleSeparator: " | ",
  description: "Bilingual Quran learning platform — learn Arabic letters, Quranic words, and recitation.",
  locale: "en_US",
  alternateLocale: "ar_SA",
  themeColor: {
    light: "#ffffff",
    dark: "#020617",
  },
} as const;

/**
 * Builds the root metadata object with title template.
 * Called from root layout's generateMetadata().
 */
export function buildRootMetadata(appName?: string): Metadata {
  const name = appName || seoConfig.defaultTitle;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: name,
      template: `%s${seoConfig.titleSeparator}${name}`,
    },
    description: seoConfig.description,
    applicationName: name,
    openGraph: {
      title: {
        default: name,
        template: `%s${seoConfig.titleSeparator}${name}`,
      },
      description: seoConfig.description,
      url: BASE_URL,
      siteName: name,
      locale: seoConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: name,
        template: `%s${seoConfig.titleSeparator}${name}`,
      },
      description: seoConfig.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Viewport config — exported separately from metadata (Next.js 14+ requirement).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: seoConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: seoConfig.themeColor.dark },
  ],
};
