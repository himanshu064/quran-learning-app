import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  let appName = "Quran Learning";
  let settingsLang: "ar" | "en" = "en";
  try {
    const settings = await getSettings();
    appName = settings.app_name || appName;
    if (
      settings.default_language === "ar" ||
      settings.default_language === "en"
    ) {
      settingsLang = settings.default_language;
    }
  } catch {}

  const cookieStore = await cookies();
  const langCookie = cookieStore.get("app_language")?.value;
  const defaultLanguage =
    langCookie === "ar" || langCookie === "en" ? langCookie : settingsLang;

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      appName={appName}
      defaultLanguage={defaultLanguage}
    >
      {children}
    </AppShell>
  );
}
