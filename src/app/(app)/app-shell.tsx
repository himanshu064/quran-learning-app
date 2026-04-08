"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LanguageProvider, LessonProvider, AudioProvider } from "@/providers";
import { UserSidebar, UserTopbar, MiniPlayer } from "@/components/app";

export function AppShell({
  userName,
  userEmail,
  appName,
  defaultLanguage,
  children,
}: {
  userName: string;
  userEmail: string;
  appName: string;
  defaultLanguage: "ar" | "en";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Dashboard uses its own UnifiedTopbar — hide default topbar there
  const isDashboard = pathname === "/dashboard";

  return (
    <LanguageProvider defaultLanguage={defaultLanguage}>
      <LessonProvider>
        <AudioProvider>
          <SidebarProvider>
            <UserSidebar
              userName={userName}
              userEmail={userEmail}
              appName={appName}
            />
            <SidebarInset>
              {!isDashboard && <UserTopbar />}
              <main
                className={
                  isDashboard
                    ? "flex overflow-auto bg-background p-3 md:p-5 lg:p-6"
                    : "flex-1 overflow-auto p-4 md:p-6 lg:p-8"
                }
              >
                {children}
              </main>
              <MiniPlayer />
            </SidebarInset>
          </SidebarProvider>
        </AudioProvider>
      </LessonProvider>
    </LanguageProvider>
  );
}
