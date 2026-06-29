import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    redirect("/dashboard");
  }

  const settings = await getSettings();

  // Read language from cookie (set by LanguageProvider on toggle)
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("app_language")?.value;
  const defaultLanguage =
    langCookie === "ar" || langCookie === "en"
      ? langCookie
      : (settings.default_language === "ar" || settings.default_language === "en")
        ? settings.default_language
        : "en";

  return (
    <AdminShell
      adminName={session.user.name}
      adminEmail={session.user.email}
      appName={settings.app_name || "Quran Learning"}
      announcement={settings.announcement || ""}
      defaultLanguage={defaultLanguage}
    >
      {children}
    </AdminShell>
  );
}
